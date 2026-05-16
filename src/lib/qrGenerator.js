import QRCode from 'qrcode'

export async function generateQrDataUrl(url) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 256,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

export async function generateQrPngBytes(url) {
  const dataUrl = await generateQrDataUrl(url)
  const res = await fetch(dataUrl)
  const buf = await res.arrayBuffer()
  return new Uint8Array(buf)
}
