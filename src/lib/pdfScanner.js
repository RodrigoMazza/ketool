import * as pdfjsLib from 'pdfjs-dist'

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

const MARKER_REGEX = /\{\{([A-Z0-9_]+)\}\}/g

/**
 * Scans a PDF for:
 *   - {{MARKER}} placeholders in text (type: 'text') — returns position, font size, detected color
 *   - Magenta (#FF00FF) filled rectangles (type: 'qr') — returns position and size
 *
 * Coordinates are in PDF space (y=0 at bottom of page), compatible with pdf-lib.
 *
 * @param {ArrayBuffer} pdfBuffer
 * @returns {Promise<Array>}
 */
export async function scanPdfForMarkers(pdfBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise
  // Map fieldKey → marker: groups repeated occurrences of the same marker across pages
  const markerMap = new Map()
  const qrMarkers = []
  let qrCount = 0

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    const pageIndex = pageNum - 1

    // Single operator list pass: color positions for text + magenta rect detection
    const { colorPositions, rectangles } = await analyzePageOperators(page, pageIndex)

    // Accumulate text items into lines (same y ± 2pt tolerance)
    const textContent = await page.getTextContent()
    const lines = []
    for (const item of textContent.items) {
      if (!item.str) continue
      const x = item.transform[4]
      const y = item.transform[5]
      const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
      const w = item.width || 0
      const h = item.height || fontSize

      const existing = lines.find(l => Math.abs(l.y - y) < 2)
      if (existing) {
        existing.text += item.str
        existing.items.push({ str: item.str, x, y, width: w, height: h, fontSize, fontName: item.fontName })
      } else {
        lines.push({
          y,
          text: item.str,
          items: [{ str: item.str, x, y, width: w, height: h, fontSize, fontName: item.fontName }],
        })
      }
    }

    // Find {{MARKER}} placeholders — group by fieldKey across all pages
    for (const line of lines) {
      let match
      MARKER_REGEX.lastIndex = 0
      while ((match = MARKER_REGEX.exec(line.text)) !== null) {
        const fieldKey = match[1]
        let accumulated = 0
        let startItem = line.items[0]
        for (const item of line.items) {
          if (accumulated + item.str.length > match.index) {
            startItem = item
            break
          }
          accumulated += item.str.length
        }

        const { color, frameX, frameWidth } = findTextProps(startItem.x, startItem.y, colorPositions)

        const pos = {
          pageIndex,
          x: startItem.x,
          y: startItem.y,
          width: Math.max(startItem.width, 100),
          height: startItem.height || startItem.fontSize,
          fontSize: startItem.fontSize,
          frameX,
          frameWidth,
        }

        if (!markerMap.has(fieldKey)) {
          // First occurrence: create marker entry with top-level fields for UI display
          markerMap.set(fieldKey, {
            type: 'text',
            fieldKey,
            pageIndex,
            x: pos.x,
            y: pos.y,
            width: pos.width,
            height: pos.height,
            fontSize: pos.fontSize,
            fontName: startItem.fontName,
            pageHeight: viewport.height,
            color,
            frameX,
            frameWidth,
            positions: [pos],
          })
        } else {
          markerMap.get(fieldKey).positions.push(pos)
        }
      }
    }

    // Convert magenta rectangles to QR markers
    for (const rect of rectangles) {
      qrCount++
      qrMarkers.push({
        type: 'qr',
        fieldKey: `QR_${qrCount}`,
        pageIndex,
        qr_x: rect.x,
        qr_y: rect.y,
        qr_size: Math.round(Math.min(rect.width, rect.height)),
      })
    }
  }

  const textMarkers = [...markerMap.values()]

  // Merge and sort by page then y position (descending y = top-to-bottom in PDF space)
  return [...textMarkers, ...qrMarkers].sort(
    (a, b) => (a.pageIndex - b.pageIndex) || ((b.y ?? b.qr_y) - (a.y ?? a.qr_y))
  )
}

/**
 * Single pass over the page's operator list.
 * Returns:
 *   colorPositions: [{x, y, r, g, b}] — one entry per text draw op, for color matching
 *   rectangles:     [{x, y, width, height}] — magenta (#FF00FF) filled paths
 *
 * Color state is tracked with a save/restore stack.
 * pdfjs may deliver RGB channel values in 0-255 OR 0-1 scale depending on version/context;
 * both are handled explicitly.
 */
async function analyzePageOperators(page) {
  const { fnArray, argsArray } = await page.getOperatorList()
  const { OPS } = pdfjsLib

  const colorPositions = []
  const rectangles = []

  let fillColor = { r: 0, g: 0, b: 0 }
  let fillIsMagenta = false
  let clipRect = null        // active clipping rectangle (text frame bounds)
  let pendingClip = false    // true after clip/eoClip until endPath
  // Stack entries: { color, isMagenta, clip }
  const colorStack = []

  let tm = [1, 0, 0, 1, 0, 0]
  let lm = [1, 0, 0, 1, 0, 0]
  let pendingBounds = null

  // Detects #FF00FF in both 0-255 and 0-1 scales.
  // args may be a sparse Array or an object with numeric keys — both support args[n].
  function isMagenta(args) {
    const r = args[0] ?? args['0']
    const g = args[1] ?? args['1']
    const b = args[2] ?? args['2']
    if (Math.abs(r - 255) < 3 && Math.abs(g) < 3 && Math.abs(b - 255) < 3) return true
    if (Math.abs(r - 1) < 0.01 && Math.abs(g) < 0.01 && Math.abs(b - 1) < 0.01) return true
    return false
  }

  // Normalizes a channel value to 0-1 for hex conversion downstream.
  function norm(v) { const n = v ?? 0; return n > 1 ? n / 255 : n }

  for (let i = 0; i < fnArray.length; i++) {
    const op = fnArray[i]
    const args = argsArray[i]

    // ── Graphics state ────────────────────────────────────────────────
    if (op === OPS.save) {
      colorStack.push({ color: { ...fillColor }, isMagenta: fillIsMagenta, clip: clipRect })
    } else if (op === OPS.restore) {
      if (colorStack.length > 0) {
        const s = colorStack.pop()
        fillColor = s.color
        fillIsMagenta = s.isMagenta
        clipRect = s.clip ?? null
      }

    // ── Fill color operators ──────────────────────────────────────────
    } else if (op === OPS.setFillRGBColor) {
      fillIsMagenta = isMagenta(args)
      fillColor = {
        r: norm(args[0] ?? args['0']),
        g: norm(args[1] ?? args['1']),
        b: norm(args[2] ?? args['2']),
      }
    } else if (op === OPS.setFillGray) {
      const gray = norm(args[0])
      fillColor = { r: gray, g: gray, b: gray }
      fillIsMagenta = false
    } else if (op === OPS.setFillCMYKColor) {
      const [c, m, y, k] = args
      fillColor = { r: (1 - c) * (1 - k), g: (1 - m) * (1 - k), b: (1 - y) * (1 - k) }
      fillIsMagenta = false

    // ── Path construction ─────────────────────────────────────────────
    // args[2] may be an array [minX, minY, maxX, maxY] or individual scalars at [2..5]
    } else if (op === OPS.constructPath) {
      const b = Array.isArray(args[2]) ? args[2] : [args[2], args[3], args[4], args[5]]
      pendingBounds = { minX: b[0], minY: b[1], maxX: b[2], maxY: b[3] }

    // ── Fill operations ───────────────────────────────────────────────
    } else if (
      op === OPS.fill || op === OPS.eoFill ||
      op === OPS.fillStroke || op === OPS.eoFillStroke
    ) {
      if (pendingBounds && fillIsMagenta) {
        const { minX, minY, maxX, maxY } = pendingBounds
        rectangles.push({ x: minX, y: minY, width: maxX - minX, height: maxY - minY })
      }
      pendingBounds = null
      pendingClip = false

    // ── Clip operators ────────────────────────────────────────────────
    // W / W* — apply current path as clip region (text frame boundary in InDesign)
    } else if (op === OPS.clip || op === OPS.eoClip) {
      pendingClip = true

    // n — end path without painting; if preceded by clip, commit clipRect
    } else if (op === OPS.endPath) {
      if (pendingClip && pendingBounds) {
        const { minX, minY, maxX, maxY } = pendingBounds
        clipRect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
      }
      pendingClip = false
      pendingBounds = null

    // ── Text matrix ───────────────────────────────────────────────────
    } else if (op === OPS.setTextMatrix) {
      tm = [...args]
      lm = [...args]
    } else if (op === OPS.moveText) {
      lm = [lm[0], lm[1], lm[2], lm[3], lm[4] + args[0], lm[5] + args[1]]
      tm = [...lm]
    } else if (op === OPS.moveTextSetLeading) {
      lm = [lm[0], lm[1], lm[2], lm[3], lm[4] + args[0], lm[5] + args[1]]
      tm = [...lm]
    } else if (op === OPS.nextLine) {
      tm = [...lm]

    // ── Text show operators ───────────────────────────────────────────
    } else if (
      op === OPS.showText ||
      op === OPS.showSpacedText ||
      op === OPS.nextLineShowText ||
      op === OPS.nextLineSetSpacingShowText
    ) {
      colorPositions.push({ x: tm[4], y: tm[5], ...fillColor, clipRect })
    }
  }

  return { colorPositions, rectangles }
}

/**
 * Nearest-neighbor lookup (15pt tolerance) that returns text color + clip rect in one pass.
 * clipRect (when present) is the InDesign text frame bounding box, sourced from the W/n
 * clip path that wraps each text frame in the PDF operator stream.
 */
function findTextProps(x, y, colorPositions) {
  const TOLERANCE = 15
  let best = null
  let bestDist = Infinity

  for (const cp of colorPositions) {
    const dist = Math.hypot(cp.x - x, cp.y - y)
    if (dist < bestDist) {
      bestDist = dist
      best = cp
    }
  }

  const toHex = v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')

  if (!best || bestDist > TOLERANCE) {
    return { color: '#000000', frameX: null, frameWidth: null }
  }

  return {
    color: `#${toHex(best.r)}${toHex(best.g)}${toHex(best.b)}`,
    frameX: best.clipRect?.x ?? null,
    frameWidth: best.clipRect?.width ?? null,
  }
}
