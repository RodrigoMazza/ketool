import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

/**
 * Renders the first page of a PDF to a PNG blob at the target width.
 * Height is derived from the page's natural aspect ratio.
 *
 * @param {Uint8Array} pdfBytes
 * @param {number} targetWidth  - desired output width in pixels
 * @returns {Promise<Blob>}
 */
export async function renderPdfToPng(pdfBytes, targetWidth) {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise
  const page = await pdf.getPage(1)

  const baseViewport = page.getViewport({ scale: 1 })
  const scale = targetWidth / baseViewport.width
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)

  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('canvas.toBlob falló')), 'image/png')
  })
}
