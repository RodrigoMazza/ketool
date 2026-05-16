import { useEffect, useState } from 'react'
import { getAllFonts, createFont } from '@/services/fonts'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/**
 * Props:
 *   value          — selected font_id (null = no font)
 *   onChange       — (fontId | null) => void
 *   fonts          — optional pre-loaded font list; if omitted, loads internally
 *   onFontsUpdate  — (newFontList) => void, called after a new font is uploaded
 *   placeholder    — select placeholder text (default: "Sin fuente (Helvetica)")
 *   label          — select label text (default: "Fuente tipográfica")
 */
export default function FontSelector({
  value,
  onChange,
  fonts: fontsProp,
  onFontsUpdate,
  placeholder = 'Sin fuente (Helvetica)',
  label = 'Fuente tipográfica',
}) {
  const [internalFonts, setInternalFonts] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFile, setNewFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Only load from DB when no external list is provided
  useEffect(() => {
    if (fontsProp === undefined) {
      getAllFonts().then(setInternalFonts).catch(() => {})
    }
  }, [fontsProp])

  const fonts = fontsProp ?? internalFonts

  async function handleUpload() {
    if (!newName.trim() || !newFile) return
    setUploading(true)
    setUploadError('')
    try {
      const font = await createFont(newName.trim(), newFile)
      const updated = [...fonts, font].sort((a, b) => a.name.localeCompare(b.name))
      if (fontsProp !== undefined) {
        onFontsUpdate?.(updated)
      } else {
        setInternalFonts(updated)
      }
      onChange(font.id)
      setNewName('')
      setNewFile(null)
      setShowUpload(false)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const options = fonts.map(f => ({ value: f.id, label: f.name }))

  return (
    <div className="space-y-1.5">
      <Select
        label={label}
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        options={options}
        placeholder={placeholder}
      />
      {showUpload ? (
        <div className="border border-accent/30 rounded-lg p-3 space-y-3 bg-accent/5">
          {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
          <Input
            label="Nombre"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Inter Bold"
            autoFocus
          />
          <div>
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${newFile ? 'border-success bg-green-50' : 'border-border hover:border-accent/50'}`}>
                <input
                  type="file"
                  accept=".ttf,.otf"
                  className="sr-only"
                  onChange={e => {
                    const file = e.target.files[0] || null
                    setNewFile(file)
                    if (file) {
                      const derived = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim()
                      setNewName(prev => prev || derived)
                    }
                  }}
                />
                {newFile
                  ? <p className="text-xs text-ink">✅ {newFile.name}</p>
                  : <p className="text-xs text-ink-muted">Subir .ttf o .otf</p>
                }
              </div>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => { setShowUpload(false); setNewName(''); setNewFile(null); setUploadError('') }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              loading={uploading}
              disabled={!newName.trim() || !newFile}
            >
              Subir
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="text-xs text-accent hover:underline"
        >
          + Subir nueva fuente
        </button>
      )}
    </div>
  )
}
