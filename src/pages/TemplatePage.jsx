import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getTemplateById, getTemplateFields } from '@/services/templates'
import { logDownload } from '@/services/downloads'
import { generateFilledPdf } from '@/lib/pdfProcessor'
import { getFontsByIds } from '@/services/fonts'
import { renderPdfToPng, getPdfDimensions } from '@/lib/pdfRenderer'
import { triggerDownload } from '@/lib/downloadHelper'
import TemplateFieldForm from '@/components/templates/TemplateFieldForm'
import PdfPreview from '@/components/templates/PdfPreview'
import DownloadButtons from '@/components/templates/DownloadButtons'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

export default function TemplatePage({ forcePreview = false, backUrl = '/dashboard' }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isPreview = forcePreview || searchParams.get('preview') === '1'
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [template, setTemplate] = useState(null)
  const [fields, setFields] = useState([])
  const [fieldValues, setFieldValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Field indicator and preview states
  const [activeField, setActiveField] = useState(null)
  const [pdfDimensions, setPdfDimensions] = useState(null)
  const [hasPreviewed, setHasPreviewed] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [generatedPdfBytes, setGeneratedPdfBytes] = useState(null)

  useEffect(() => {
    Promise.all([
      getTemplateById(id),
      getTemplateFields(id),
    ])
      .then(([tmpl, flds]) => {
        setTemplate(tmpl)
        setFields(flds)
        // Pre-fill fields that have a default_value
        const defaults = {}
        flds.forEach(f => {
          const dv = f.field_metadata?.default_value
          if (dv) defaults[f.field_key] = dv
        })
        setFieldValues(defaults)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (template?.pdf_url) {
      getPdfDimensions(template.pdf_url)
        .then(setPdfDimensions)
        .catch(err => console.error('Error fetching PDF dimensions:', err))
    }
  }, [template])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFieldChange(newValues) {
    setFieldValues(newValues)
    setHasPreviewed(false)
    setGeneratedPdfBytes(null)
  }

  async function buildPdf() {
    // Validate required fields
    const missing = fields.filter(f => f.required && !fieldValues[f.field_key]?.toString().trim())
    if (missing.length > 0) {
      const labels = missing.map(f => f.label).join(', ')
      throw new Error(`Completá los campos obligatorios: ${labels}`)
    }

    // Resolve per-field font IDs to URLs in one batch query
    const fontIds = [...new Set(
      fields.map(f => f.field_metadata?.font_id).filter(Boolean)
    )]
    const fieldFontUrls = fontIds.length ? await getFontsByIds(fontIds) : {}

    const pdfBytes = await generateFilledPdf(
      template.pdf_url,
      fields,
      fieldValues,
      template.fonts?.file_url || null,
      fieldFontUrls,
      template.default_color || null,
    )
    return pdfBytes
  }

  async function handlePreview() {
    setError('')
    setPreviewLoading(true)
    try {
      const pdfBytes = await buildPdf()
      setGeneratedPdfBytes(pdfBytes)
      const pngBlob = await renderPdfToPng(pdfBytes, template.png_width)
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      
      const url = URL.createObjectURL(pngBlob)
      setPreviewUrl(url)
      setHasPreviewed(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleDownloadPdf() {
    setError('')
    try {
      let pdfBytes = generatedPdfBytes
      if (!pdfBytes) {
        pdfBytes = await buildPdf()
        setGeneratedPdfBytes(pdfBytes)
      }
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      triggerDownload(blob, `${template.name}.pdf`)
      if (!isPreview) await logDownload(profile.id, template.id, 'pdf', fieldValues).catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDownloadPng() {
    setError('')
    try {
      let pdfBytes = generatedPdfBytes
      if (!pdfBytes) {
        pdfBytes = await buildPdf()
        setGeneratedPdfBytes(pdfBytes)
      }
      const pngBlob = await renderPdfToPng(pdfBytes, template.png_width)
      triggerDownload(pngBlob, `${template.name}.png`)
      if (!isPreview) await logDownload(profile.id, template.id, 'png', fieldValues).catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-6 h-6 text-accent" />
      </div>
    )
  }

  if (error || !template) {
    return <ErrorMessage message={error || 'Plantilla no encontrada.'} />
  }

  return (
    <div>
      {isPreview && (
        <div className="mb-4 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2 text-sm text-accent font-medium">
          Modo previsualización — las descargas no se registran en el historial.
        </div>
      )}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)}>
          ← Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: preview */}
        <div className="space-y-4">
          <PdfPreview
            pdfUrl={template.pdf_url}
            thumbnail={previewUrl || template.thumbnail_url}
            activeField={activeField}
            pdfDimensions={pdfDimensions}
          />
        </div>

        {/* Right: form + download */}
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-ink">{template.name}</h1>
            {template.categories?.name && (
              <p className="text-sm text-ink-muted mt-0.5">{template.categories.name}</p>
            )}
          </div>

          {fields.length > 0 ? (
            <>
              <div className="bg-white rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-ink mb-4">Completar datos</h2>
                <TemplateFieldForm
                  fields={fields}
                  initialValues={fieldValues}
                  onChange={handleFieldChange}
                  onFocusField={setActiveField}
                />
              </div>

              {hasPreviewed ? (
                <div className="space-y-4">
                  <DownloadButtons
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadPng={handleDownloadPng}
                  />
                  <p className="text-xs text-ink-muted">
                    ¿Querés hacer algún cambio? Editá los campos de arriba y hacé clic en previsualizar de nuevo.
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full justify-center"
                  onClick={handlePreview}
                  loading={previewLoading}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Previsualizar resultado
                </Button>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">Esta plantilla no tiene campos editables.</p>
              <DownloadButtons
                onDownloadPdf={handleDownloadPdf}
                onDownloadPng={handleDownloadPng}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
