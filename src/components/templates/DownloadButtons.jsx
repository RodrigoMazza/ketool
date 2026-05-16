import { useState } from 'react'
import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function DownloadButtons({ onDownloadPdf, onDownloadPng }) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pngLoading, setPngLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePdf() {
    setError('')
    setPdfLoading(true)
    try {
      await onDownloadPdf()
    } catch (err) {
      setError(err.message)
    } finally {
      setPdfLoading(false)
    }
  }

  async function handlePng() {
    setError('')
    setPngLoading(true)
    try {
      await onDownloadPng()
    } catch (err) {
      setError(err.message)
    } finally {
      setPngLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button onClick={handlePdf} loading={pdfLoading} disabled={pngLoading}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar PDF
        </Button>
        <Button variant="secondary" onClick={handlePng} loading={pngLoading} disabled={pdfLoading}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Descargar PNG
        </Button>
      </div>
      <ErrorMessage message={error} />
    </div>
  )
}
