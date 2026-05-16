import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getTemplateById, getTemplateFields, getTemplateClients,
  getAllCategories, createCategory, updateTemplate,
} from '@/services/templates'
import { getAllClients } from '@/services/clients'
import { uploadPdf, uploadThumbnail } from '@/services/storage'
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

export default function AdminTemplateEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Template data
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [categories, setCategories] = useState([])
  const [pngWidth, setPngWidth] = useState(1080)
  const [pngHeight, setPngHeight] = useState(1080)
  const [existingPdfUrl, setExistingPdfUrl] = useState('')
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState('')
  const [fontId, setFontId] = useState(null)
  const [defaultColor, setDefaultColor] = useState('#000000')

  // New files (optional re-upload)
  const [newPdfFile, setNewPdfFile] = useState(null)
  const [newThumbnailFile, setNewThumbnailFile] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [detectedMarkers, setDetectedMarkers] = useState([])

  const [fields, setFields] = useState([])
  const [clients, setClients] = useState([])
  const [selectedClientIds, setSelectedClientIds] = useState([])

  useEffect(() => {
    Promise.all([
      getTemplateById(id),
      getTemplateFields(id),
      getTemplateClients(id),
      getAllCategories(),
      getAllClients(),
    ]).then(([template, flds, tcs, cats, cls]) => {
      setName(template.name)
      setCategoryId(template.category_id)
      setPngWidth(template.png_width)
      setPngHeight(template.png_height)
      setExistingPdfUrl(template.pdf_url)
      setExistingThumbnailUrl(template.thumbnail_url)
      setFontId(template.font_id ?? null)
      setDefaultColor(template.default_color ?? '#000000')
      setFields(flds)
      setCategories(cats)
      setClients(cls)
      setSelectedClientIds(tcs.map(tc => tc.client_id))
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handlePdfRescan(file) {
    setNewPdfFile(file)
    setScanning(true)
    try {
      const buf = await file.arrayBuffer()
      const markers = await scanPdfForMarkers(buf)
      setDetectedMarkers(markers)
    } catch (err) {
      console.error('Scan error:', err)
    } finally {
      setScanning(false)
    }
  }

  function handleThumbnailChange(file) {
    setNewThumbnailFile(file)
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

  async function handleSave() {
    setError('')
    if (!name.trim()) { setError('Ingresá el nombre.'); return }
    if (!categoryId) { setError('Seleccioná una categoría.'); return }

    setSaving(true)
    try {
      let pdfUrl = existingPdfUrl
      let thumbnailUrl = existingThumbnailUrl

      if (newPdfFile) pdfUrl = await uploadPdf(newPdfFile, id)
      if (newThumbnailFile) thumbnailUrl = await uploadThumbnail(newThumbnailFile, id)

      const fieldsToSave = fields.map((f, i) => ({ ...f, sort_order: i }))
      await updateTemplate(
        id,
        { name: name.trim(), category_id: categoryId, pdf_url: pdfUrl, thumbnail_url: thumbnailUrl, font_id: fontId, default_color: defaultColor, png_width: pngWidth, png_height: pngHeight },
        fieldsToSave,
        selectedClientIds
      )

      navigate('/admin/templates')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-6 h-6 text-accent" />
      </div>
    )
  }

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }))

  return (
    <div>
      <PageHeader title="Editar plantilla" />
      <ErrorMessage message={error} className="mb-4" />

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink">Datos generales</h2>
          <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} required autoComplete="off" />

          <div className="space-y-1.5">
            <Select label="Categoría" value={categoryId} onChange={e => setCategoryId(e.target.value)} options={catOptions} placeholder="Seleccionar..." required />
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
              <button type="button" onClick={() => setShowNewCategory(true)} className="text-xs text-accent hover:underline">
                + Crear nueva categoría
              </button>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-ink mb-1">Dimensiones PNG</p>
            <p className="text-xs text-ink-muted mb-2">Se actualizan al reemplazar el thumbnail. Podés ajustarlas manualmente.</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ancho (px)" type="number" value={pngWidth} onChange={e => setPngWidth(parseInt(e.target.value) || 1080)} />
              <Input label="Alto (px)" type="number" value={pngHeight} onChange={e => setPngHeight(parseInt(e.target.value) || 1080)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Archivos</h2>

          <div className="grid gap-4">
            {[
              { label: 'PDF base', existing: existingPdfUrl, onChange: e => handlePdfRescan(e.target.files[0]), accept: 'application/pdf', name: newPdfFile?.name },
              { label: 'Thumbnail', existing: existingThumbnailUrl, onChange: e => handleThumbnailChange(e.target.files[0]), accept: 'image/*', name: newThumbnailFile?.name },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-medium text-ink-muted block mb-1">{f.label}</label>
                {f.existing && !f.name && (
                  <p className="text-xs text-success mb-1">✓ Archivo actual disponible</p>
                )}
                <label className="block cursor-pointer">
                  <div className={`border border-dashed rounded-lg p-3 text-center transition-colors ${f.name ? 'border-success bg-green-50' : 'border-border hover:border-accent/50'}`}>
                    <input type="file" accept={f.accept} className="sr-only" onChange={f.onChange} />
                    {scanning && f.label === 'PDF base' ? (
                      <div className="flex items-center justify-center gap-2">
                        <Spinner className="w-4 h-4 text-accent" />
                        <span className="text-xs text-ink-muted">Escaneando...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-ink-muted">{f.name || `Reemplazar ${f.label.toLowerCase()}`}</p>
                    )}
                  </div>
                </label>
              </div>
            ))}
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
        </div>

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Campos editables</h2>
          <TemplateFormFields fields={fields} onChange={setFields} detectedMarkers={detectedMarkers} />
        </div>

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Clientes asignados</h2>
          <ClientAssignmentPanel clients={clients} selectedIds={selectedClientIds} onChange={setSelectedClientIds} />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="secondary" onClick={() => navigate('/admin/templates')}>Cancelar</Button>
        <Button onClick={handleSave} loading={saving}>Guardar cambios</Button>
      </div>
    </div>
  )
}
