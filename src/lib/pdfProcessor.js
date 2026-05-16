import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { generateQrPngBytes } from './qrGenerator'
import { formatDateForPdf } from './dateFormatter'

/**
 * Generates a filled PDF by replacing {{MARKERS}} with user values.
 *
 * @param {string} pdfUrl          - URL to fetch the base PDF
 * @param {Array}  fields          - template_fields rows with field_metadata
 * @param {Object} fieldValues     - { fieldKey: value }
 * @param {string|null} fontUrl    - template-level TTF/OTF font URL (fallback for all fields)
 * @param {Object} fieldFontUrls   - { [fontId]: url } for per-field font overrides
 * @returns {Promise<Uint8Array>}
 */
export async function generateFilledPdf(pdfUrl, fields, fieldValues, fontUrl = null, fieldFontUrls = {}, defaultColor = null) {
  const pdfRes = await fetch(pdfUrl)
  const pdfBytes = await pdfRes.arrayBuffer()
  const pdfDoc = await PDFDocument.load(pdfBytes)
  pdfDoc.registerFontkit(fontkit)
  const pages = pdfDoc.getPages()

  const templateFont = await loadCustomFont(pdfDoc, fontUrl)
  const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const templateActiveFont = templateFont ?? fallbackFont

  console.log('[PDF] template font:', templateFont ? 'custom (embedded)' : 'Helvetica (fallback)')

  // Cache embedded per-field fonts to avoid re-embedding the same file multiple times
  const fontCache = {}
  async function getFontForField(field) {
    const fontId = field.field_metadata?.font_id
    const url = fontId ? fieldFontUrls[fontId] : null
    if (!url) return templateActiveFont
    if (fontCache[fontId]) return fontCache[fontId]
    const loaded = await loadCustomFont(pdfDoc, url)
    fontCache[fontId] = loaded ?? templateActiveFont
    return fontCache[fontId]
  }

  for (const field of fields) {
    const value = fieldValues[field.field_key]
    if (value === undefined || value === null || value === '') continue

    if (field.field_type === 'qr') {
      await insertQrCode(pdfDoc, pages, field, value)
    } else {
      const font = await getFontForField(field)
      await replaceTextMarker(pages, field, value, font, defaultColor)
    }
  }

  return pdfDoc.save()
}

async function loadCustomFont(pdfDoc, fontUrl) {
  if (!fontUrl) {
    console.log('[PDF] no fontUrl — using Helvetica')
    return null
  }

  console.log('[PDF] fetching font:', fontUrl)

  let fontRes
  try {
    fontRes = await fetch(fontUrl)
  } catch (err) {
    // Network error (CORS, offline, etc.)
    console.warn('[PDF] font fetch network error:', err.message)
    return null
  }

  if (!fontRes.ok) {
    // 403 = Storage RLS blocking read, 404 = wrong path, etc.
    console.warn(`[PDF] font fetch failed — HTTP ${fontRes.status} ${fontRes.statusText}`)
    console.warn('[PDF] check: Storage bucket is public, or add a public SELECT policy on storage.objects for bucket_id = \'templates\'')
    return null
  }

  const fontBytes = await fontRes.arrayBuffer()
  console.log('[PDF] font fetched:', fontBytes.byteLength, 'bytes')

  if (fontBytes.byteLength < 1000) {
    // A valid TTF/OTF is never this small — likely an error response body
    console.warn('[PDF] font bytes too small (' + fontBytes.byteLength + ') — probably an error response, not a font file')
    return null
  }

  try {
    const font = await pdfDoc.embedFont(fontBytes)
    console.log('[PDF] font embedded successfully')
    return font
  } catch (err) {
    // Common reasons: WOFF format (not supported by pdf-lib — use TTF or OTF),
    // corrupted file, or a font with licensing restrictions on embedding.
    console.warn('[PDF] embedFont failed:', err.message)
    console.warn('[PDF] note: pdf-lib only supports TTF and OTF. WOFF files are not supported.')
    return null
  }
}

function parseHexColor(hex) {
  if (!hex || hex.length !== 7 || hex[0] !== '#') return null
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return rgb(r, g, b)
}

async function replaceTextMarker(pages, field, value, font, defaultColor) {
  const meta = field.field_metadata
  if (!meta) return

  const displayValue = field.field_type === 'date'
    ? formatDateForPdf(value)
    : String(value)

  // Color priority: field color (detected/overridden) → template default → black
  const textColor = parseHexColor(meta.color) ?? parseHexColor(defaultColor) ?? rgb(0, 0, 0)
  const textAlign = meta.textAlign || 'left'

  // Support repeated markers: positions array (multi-occurrence) or single root position
  const positions = meta.positions?.length
    ? meta.positions
    : [{ pageIndex: meta.pageIndex ?? 0, x: meta.x, y: meta.y, width: meta.width, height: meta.height, fontSize: meta.fontSize }]

  for (const pos of positions) {
    const page = pages[pos.pageIndex ?? 0]
    const { width: pageWidth } = page.getSize()
    const fontSize = pos.fontSize || meta.fontSize || 12

    let xDraw = pos.x

    if (textAlign !== 'left') {
      const markerWidth = font.widthOfTextAtSize(`{{${field.field_key}}}`, fontSize)
      const textWidth   = font.widthOfTextAtSize(displayValue, fontSize)
      if (textAlign === 'center') {
        xDraw = (pos.x + markerWidth / 2) - (textWidth / 2)
      } else {
        xDraw = (pos.x + markerWidth) - textWidth
      }
    }

    // Use remaining page width as ceiling so pdf-lib never word-wraps the value.
    const maxWidth = pageWidth - xDraw

    page.drawText(displayValue, {
      x: xDraw,
      y: pos.y,
      size: fontSize,
      font,
      color: textColor,
      maxWidth,
    })
  }
}

async function insertQrCode(pdfDoc, pages, field, url) {
  const qrBytes = await generateQrPngBytes(url)
  const qrImage = await pdfDoc.embedPng(qrBytes)
  const pageIndex = field.field_metadata?.pageIndex ?? 0
  const page = pages[pageIndex]
  const size = field.qr_size || 80

  // The QR PNG has a white background, so it covers the magenta placeholder naturally.
  page.drawImage(qrImage, {
    x: field.qr_x || 0,
    y: field.qr_y || 0,
    width: size,
    height: size,
  })
}
