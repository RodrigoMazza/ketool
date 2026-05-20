import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCategories, createCategory, createTemplate } from '@/services/templates'
import { getAllClients } from '@/services/clients'
import { getAllFonts } from '@/services/fonts'
import { uploadPdf, uploadThumbnail, deleteTemplateFiles } from '@/services/storage'
import { scanPdfForMarkers } from '@/lib/pdfScanner'
import TemplateFormFields from '@/components/admin/TemplateFormFields'
import ClientAssignmentPanel from '@/components/admin/ClientAssignmentPanel'
import FontSelector from '@/components/admin/FontSelector'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Spinner from '@/components/ui/Spinner'
import PageHeader from '@/components/layout/PageHeader'

const STEPS = ['Archivo PDF', 'Metadatos', 'Campos', 'Confirmar']

export default function AdminTemplateNew() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // PDF scanning
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfBytes, setPdfBytes] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [detectedMarkers, setDetectedMarkers] = useState([])

  // Metadata
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [categories, setCategories] = useState([])
  const [fonts, setFonts] = useState([])
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(null)
  const [fontId, setFontId] = useState(null)
  const [defaultColor, setDefaultColor] = useState('#000000')
  const [pngWidth, setPngWidth] = useState(1080)
  const [pngHeight, setPngHeight] = useState(1080)

  // Fields
  const [fields, setFields] = useState([])

  // Clients
  const [clients, setClients] = useState([])
  const [selectedClientIds, setSelectedClientIds] = useState([])

  useEffect(() => {
    Promise.all([getAllCategories(), getAllClients(), getAllFonts()]).then(([cats, cls, fts]) => {
      setCategories(cats)
      setClients(cls)
      setFonts(fts)
    })
  }, [])

  useEffect(() => {
    if (!thumbnailFile) { setThumbnailPreviewUrl(null); return }
    const url = URL.createObjectURL(thumbnailFile)
    setThumbnailPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [thumbnailFile])

  async function handlePdfUpload(file) {
    if (pdfFile && fields.length > 0) {
      const confirmScan = window.confirm('¿Querés re-escanear el nuevo PDF? Se perderán los campos configurados.')
      if (!confirmScan) {
        return
      }
      setFields([])
    }

    setPdfFile(file)
    setScanning(true)
    setDetectedMarkers([])
    try {
      const buf = await file.arrayBuffer()
      setPdfBytes(buf)
      const markers = await scanPdfForMarkers(buf)
      setDetectedMarkers(markers)

      // Auto-create fields from detected markers
      if (markers.length > 0 && fields.length === 0) {
        setFields(markers.map((m, i) => {
          const label = m.fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          if (m.type === 'qr') {
            return {
              field_key: m.fieldKey,
              label,
              field_type: 'qr',
              required: false,
              sort_order: i,
              qr_x: m.qr_x,
              qr_y: m.qr_y,
              qr_size: m.qr_size,
              field_metadata: { pageIndex: m.pageIndex },
            }
          }
          return {
            field_key: m.fieldKey,
            label: (() => { const s = m.fieldKey.replace(/_/g, ' ').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1) })(),
            field_type: 'text',
            required: false,
            sort_order: i,
            qr_x: null,
            qr_y: null,
            qr_size: null,
            field_metadata: {
              pageIndex: m.pageIndex,
              x: m.x,
              y: m.y,
              width: m.width,
              height: m.height,
              fontSize: m.fontSize,
              fontName: m.fontName,
              color: m.color,
              frameX: m.frameX ?? null,
              frameWidth: m.frameWidth ?? null,
              positions: m.positions,
              textAlign: m.textAlign ?? 'left',
              prefix: m.prefix ?? null,
              originalMarker: m.originalMarker ?? null,
              scannedWidth: m.scannedWidth ?? null,
            },
          }
        }))
      }
    } catch (err) {
      console.error('Scan error:', err)
    } finally {
      setScanning(false)
    }
  }

  function handleThumbnailChange(file) {
    setThumbnailFile(file)
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setPngWidth(img.naturalWidth)
      setPngHeight(img.naturalHeight)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    try {
      const cat = await createCategory(newCategoryName.trim())
      setCategories(prev => [...prev, cat])
      setCategoryId(cat.id)
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleNext() {
    setError('')
    if (step === 0) {
      if (!pdfFile) {
        setError('Subí el archivo PDF.')
        return
      }
    } else if (step === 1) {
      if (!name.trim()) {
        setError('Ingresá el nombre de la plantilla.')
        return
      }
      if (!categoryId) {
        setError('Seleccioná una categoría.')
        return
      }
      if (!thumbnailFile) {
        setError('Subí la imagen de previsualización.')
        return
      }
    }
    setStep(s => s + 1)
  }

  async function handleSave() {
    setError('')
    if (!pdfFile) { setError('Subí el archivo PDF.'); return }
    if (!name.trim()) { setError('Ingresá el nombre de la plantilla.'); return }
    if (!categoryId) { setError('Seleccioná una categoría.'); return }
    if (!thumbnailFile) { setError('Subí la imagen de previsualización.'); return }

    setSaving(true)
    const templateId = crypto.randomUUID()
    try {
      // Sequential uploads so the console log identifies exactly which step fails.
      // "new row violates row-level security policy" can come from storage.objects
      // (Storage RLS) OR from templates/template_fields/template_clients (DB RLS).
      console.log('[Template] 1/4 uploading PDF...')
      const pdfUrl = await uploadPdf(pdfFile, templateId)
      console.log('[Template] 1/4 done')

      console.log('[Template] 2/4 uploading thumbnail...')
      const thumbnailUrl = await uploadThumbnail(thumbnailFile, templateId)
      console.log('[Template] 2/4 done')

      const fieldsToSave = fields.map((f, i) => ({ ...f, sort_order: i }))
      console.log('[Template] 3/4 INSERT templates...')
      await createTemplate(
        {
          id: templateId,
          name: name.trim(),
          category_id: categoryId,
          pdf_url: pdfUrl,
          thumbnail_url: thumbnailUrl,
          font_id: fontId,
          default_color: defaultColor,
          png_width: pngWidth,
          png_height: pngHeight,
          is_active: true,
        },
        fieldsToSave,
        selectedClientIds
      )
      console.log('[Template] 3/4 done')

      console.log('[Template] 4/4 done — navigating')
      navigate('/admin/templates')
    } catch (err) {
      console.error('[Template] FAILED — full error:', err)
      setError(err.message)
      await deleteTemplateFiles(templateId).catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }))

  return (
    <div>
      <PageHeader title="Nueva plantilla" />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                i < step ? 'bg-success text-white' :
                i === step ? 'bg-accent text-white' :
                'bg-surface border border-border text-ink-muted'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'font-medium text-ink' : 'text-ink-muted'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <ErrorMessage message={error} className="mb-4" />

        {/* Step 0: PDF upload */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-ink">Subir PDF base</h2>
            <p className="text-sm text-ink-muted">
              El PDF debe contener marcadores en formato <code className="bg-surface px-1 rounded">{'{{NOMBRE_CAMPO}}'}</code> donde querés insertar texto.
            </p>

            <label className="block">
              <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${pdfFile ? 'border-success bg-green-50' : 'border-border hover:border-accent/50'}`}>
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={e => {
                    const file = e.target.files[0]
                    if (file) {
                      handlePdfUpload(file)
                      e.target.value = ''
                    }
                  }}
                />
                {scanning ? (
                  <div className="flex flex-col items-center gap-2">
                    <Spinner className="w-8 h-8 text-accent" />
                    <p className="text-sm text-ink-muted">Escaneando marcadores...</p>
                  </div>
                ) : pdfFile ? (
                  <div>
                    <div className="text-2xl mb-2">✅</div>
                    <p className="text-sm font-medium text-ink">{pdfFile.name}</p>
                    {detectedMarkers.length > 0 ? (
                      <p className="text-xs text-success mt-1">
                        {detectedMarkers.length} marcador{detectedMarkers.length !== 1 ? 'es' : ''} detectado{detectedMarkers.length !== 1 ? 's' : ''}:
                        {' '}{detectedMarkers.map(m => m.fieldKey).join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-muted mt-1">No se detectaron marcadores. Podés agregar campos manualmente.</p>
                    )}
                    <p className="text-xs text-accent mt-2">Hacé clic para cambiar</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2 opacity-30">📄</div>
                    <p className="text-sm font-medium text-ink">Arrastrá o hacé clic para subir el PDF</p>
                    <p className="text-xs text-ink-muted mt-1">Máximo 50 MB</p>
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Step 1: Metadata & Clients */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-ink">Datos de la plantilla</h2>

            <Input
              label="Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="off"
              placeholder="Newsletter mensual"
            />

            <div className="space-y-1.5">
              <Select
                label="Categoría"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                options={catOptions}
                placeholder="Seleccionar categoría..."
                required
              />
              {showNewCategory ? (
                <div className="flex gap-2 items-center">
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory() } if (e.key === 'Escape') setShowNewCategory(false) }}
                    placeholder="Nombre de la nueva categoría"
                    className="flex-1 rounded-lg border border-accent bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <Button type="button" size="sm" onClick={handleCreateCategory}>Crear</Button>
                  <button type="button" onClick={() => { setShowNewCategory(false); setNewCategoryName('') }} className="text-xs text-ink-muted hover:text-ink">✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="text-xs text-accent hover:underline"
                >
                  + Crear nueva categoría
                </button>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-ink block mb-1">
                Imagen de previsualización <span className="text-danger">*</span>
              </label>
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${thumbnailFile ? 'border-success bg-green-50' : 'border-border hover:border-accent/50'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={e => handleThumbnailChange(e.target.files[0] || null)}
                  />
                  {thumbnailFile ? (
                    <p className="text-sm text-ink">✅ {thumbnailFile.name}</p>
                  ) : (
                    <p className="text-sm text-ink-muted">Subir JPG, PNG o WEBP</p>
                  )}
                </div>
              </label>
            </div>

            <FontSelector value={fontId} onChange={setFontId} />

            <div>
              <label className="text-sm font-medium text-ink block mb-1">Color de texto por defecto</label>
              <p className="text-xs text-ink-muted mb-2">Fallback para campos sin color detectado ni override.</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: defaultColor }} />
                <input
                  type="color"
                  value={defaultColor}
                  onChange={e => setDefaultColor(e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm text-ink-muted font-mono">{defaultColor}</span>
              </label>
            </div>

            <div>
              <p className="text-sm font-medium text-ink mb-1">Dimensiones PNG</p>
              <p className="text-xs text-ink-muted mb-2">Se detectan automáticamente al subir la imagen. Podés ajustarlas manualmente.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ancho (px)"
                  type="number"
                  value={pngWidth}
                  onChange={e => setPngWidth(parseInt(e.target.value) || 1080)}
                  min={100}
                />
                <Input
                  label="Alto (px)"
                  type="number"
                  value={pngHeight}
                  onChange={e => setPngHeight(parseInt(e.target.value) || 1080)}
                  min={100}
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <label className="text-sm font-medium text-ink block mb-1">Asignar a clientes</label>
              <p className="text-xs text-ink-muted mb-3">Seleccioná los clientes que verán esta plantilla.</p>
              <ClientAssignmentPanel
                clients={clients}
                selectedIds={selectedClientIds}
                onChange={setSelectedClientIds}
              />
            </div>
          </div>
        )}

        {/* Step 2: Fields */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Campos editables</h2>
              {detectedMarkers.length > 0 && (
                <span className="text-xs text-success">
                  {detectedMarkers.length} marcador{detectedMarkers.length !== 1 ? 'es' : ''} detectado{detectedMarkers.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <TemplateFormFields
              fields={fields}
              onChange={setFields}
              detectedMarkers={detectedMarkers}
            />
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-ink">Confirmar creación</h2>

            {/* Thumbnail + metadata side by side */}
            <div className="flex gap-5 items-start">
              <div className="w-36 h-36 shrink-0 rounded-xl border border-border bg-surface flex items-center justify-center overflow-hidden">
                {thumbnailPreviewUrl
                  ? <img src={thumbnailPreviewUrl} alt="Miniatura" className="max-w-full max-h-full object-contain" />
                  : <span className="text-3xl opacity-20">🖼</span>
                }
              </div>

              <div className="flex-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm items-baseline">
                <span className="text-ink-muted">Nombre</span>
                <span className="font-semibold text-ink">{name}</span>

                <span className="text-ink-muted">Categoría</span>
                <span className="font-medium">{categories.find(c => c.id === categoryId)?.name || '—'}</span>

                <span className="text-ink-muted">Fuente</span>
                <span className="font-medium">
                  {fontId ? (fonts.find(f => f.id === fontId)?.name ?? 'Seleccionada') : 'Helvetica (por defecto)'}
                </span>

                <span className="text-ink-muted">Color</span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded border border-border shrink-0" style={{ backgroundColor: defaultColor }} />
                  <span className="font-mono font-medium">{defaultColor}</span>
                </span>

                <span className="text-ink-muted">Tamaño PNG</span>
                <span className="font-medium">{pngWidth} × {pngHeight} px</span>

                <span className="text-ink-muted">Clientes</span>
                <span className="font-medium">{selectedClientIds.length}</span>
              </div>
            </div>

            {/* Fields summary */}
            {fields.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                  Campos ({fields.length})
                </p>
                <div className="rounded-xl border border-border overflow-hidden">
                  {fields.map((f, i) => {
                    const typeLabel = { text: 'Texto corto', textarea: 'Texto largo', date: 'Fecha', qr: 'QR' }[f.field_type] ?? f.field_type
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm border-b border-border last:border-0 bg-white">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="flex-1 font-medium text-ink truncate">{f.label || f.field_key || '—'}</span>
                        <span className="text-xs text-ink-muted shrink-0">{typeLabel}</span>
                        {f.required && <span className="text-xs text-danger shrink-0">*</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="secondary"
          onClick={() => step === 0 ? navigate('/admin/templates') : setStep(s => s - 1)}
        >
          {step === 0 ? 'Cancelar' : '← Anterior'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext}>
            Siguiente →
          </Button>
        ) : (
          <Button onClick={handleSave} loading={saving}>
            Crear plantilla
          </Button>
        )}
      </div>
    </div>
  )
}
