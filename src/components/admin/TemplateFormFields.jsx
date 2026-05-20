import { useEffect, useState } from 'react'
import { getAllFonts } from '@/services/fonts'
import FontSelector from '@/components/admin/FontSelector'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const FIELD_TYPES = [
  { value: 'text', label: 'Texto corto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'date', label: 'Fecha' },
  { value: 'qr', label: 'Código QR' },
]

export default function TemplateFormFields({ fields, onChange, detectedMarkers = [] }) {
  const [fonts, setFonts] = useState([])

  useEffect(() => {
    getAllFonts().then(setFonts).catch(() => {})
  }, [])

  function updateField(index, key, value) {
    const updated = fields.map((f, i) => i === index ? { ...f, [key]: value } : f)
    onChange(updated)
  }

  function addField() {
    onChange([...fields, {
      field_key: '',
      label: '',
      field_type: 'text',
      required: false,
      sort_order: fields.length,
      qr_x: null,
      qr_y: null,
      qr_size: null,
      field_metadata: null,
    }])
  }

  function removeField(index) {
    onChange(fields.filter((_, i) => i !== index))
  }

  function moveUp(index) {
    if (index === 0) return
    const updated = [...fields]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    onChange(updated.map((f, i) => ({ ...f, sort_order: i })))
  }

  function moveDown(index) {
    if (index === fields.length - 1) return
    const updated = [...fields]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    onChange(updated.map((f, i) => ({ ...f, sort_order: i })))
  }

  function updateFieldMeta(index, key, value) {
    const updated = fields.map((f, i) =>
      i === index ? { ...f, field_metadata: { ...f.field_metadata, [key]: value } } : f
    )
    onChange(updated)
  }

  function autoFillFromMarker(index, marker) {
    const updated = fields.map((f, i) => {
      if (i !== index) return f
      if (marker.type === 'qr') {
        return {
          ...f,
          field_key: marker.fieldKey,
          label: marker.fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          field_type: 'qr',
          qr_x: marker.qr_x,
          qr_y: marker.qr_y,
          qr_size: marker.qr_size,
          field_metadata: { pageIndex: marker.pageIndex },
        }
      }
      const s = marker.fieldKey.replace(/_/g, ' ').toLowerCase()
      return {
        ...f,
        field_key: marker.fieldKey,
        label: s.charAt(0).toUpperCase() + s.slice(1),
        field_metadata: {
          pageIndex: marker.pageIndex,
          x: marker.x,
          y: marker.y,
          width: marker.width,
          height: marker.height,
          fontSize: marker.fontSize,
          fontName: marker.fontName,
          color: marker.color ?? '#000000',
          frameX: marker.frameX ?? null,
          frameWidth: marker.frameWidth ?? null,
          positions: marker.positions ?? null,
          textAlign: marker.textAlign ?? 'left',
          prefix: marker.prefix ?? null,
          originalMarker: marker.originalMarker ?? null,
          scannedWidth: marker.scannedWidth ?? null,
        },
      }
    })
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={index} className="rounded-xl border border-border overflow-hidden">

          {/* Header: number badge + key preview + controls */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border-b border-border">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-xs font-bold shrink-0">
              {index + 1}
            </span>
            <span className="text-xs font-mono font-medium text-ink flex-1 truncate">
              {field.field_key || <span className="text-ink-muted italic">sin clave</span>}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-1.5 rounded hover:bg-border text-ink-muted hover:text-ink disabled:opacity-30 transition-colors"
                title="Mover arriba"
              >↑</button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === fields.length - 1}
                className="p-1.5 rounded hover:bg-border text-ink-muted hover:text-ink disabled:opacity-30 transition-colors"
                title="Mover abajo"
              >↓</button>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="p-1.5 rounded hover:bg-red-50 text-danger transition-colors ml-1"
                title="Eliminar campo"
              >✕</button>
            </div>
          </div>

          <div className="bg-white p-4">

            {/* Row 1: marker key + label + type + required */}
            <div className="grid grid-cols-[2fr_2fr_1.4fr_auto] gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Clave del marcador</label>
                <div className="flex gap-1.5">
                  <input
                    value={field.field_key}
                    onChange={e => updateField(index, 'field_key', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                    placeholder="TITULO_EVENTO"
                    className="flex-1 min-w-0 rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {detectedMarkers.length > 0 && (
                    <select
                      onChange={e => {
                        const m = detectedMarkers.find(mk => mk.fieldKey === e.target.value)
                        if (m) autoFillFromMarker(index, m)
                      }}
                      className="rounded-lg border border-border bg-white px-2 py-2 text-xs focus:outline-none shrink-0"
                      defaultValue=""
                    >
                      <option value="">Detectados</option>
                      {detectedMarkers.map(m => (
                        <option key={m.fieldKey} value={m.fieldKey}>{m.fieldKey}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <Input
                label="Etiqueta visible"
                value={field.label}
                onChange={e => updateField(index, 'label', e.target.value)}
                placeholder="Título del evento"
              />

              <Select
                label="Tipo"
                value={field.field_type}
                onChange={e => updateField(index, 'field_type', e.target.value)}
                options={FIELD_TYPES}
              />

              <div className="pb-[9px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateField(index, 'required', e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-ink-muted whitespace-nowrap">Obligatorio</span>
                </label>
              </div>
            </div>

            {/* Row 2: position info + color + alignment (text) or qr coords */}
            {field.field_type === 'qr' ? (
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                <Input label="X (px)" type="number" value={field.qr_x ?? ''} onChange={e => updateField(index, 'qr_x', parseFloat(e.target.value))} placeholder="0" />
                <Input label="Y (px)" type="number" value={field.qr_y ?? ''} onChange={e => updateField(index, 'qr_y', parseFloat(e.target.value))} placeholder="0" />
                <Input label="Tamaño (px)" type="number" value={field.qr_size ?? ''} onChange={e => updateField(index, 'qr_size', parseFloat(e.target.value))} placeholder="80" />
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border flex-wrap">
                {field.field_metadata && (
                  <span className="text-xs font-mono text-ink-muted bg-surface border border-border rounded px-2 py-1 shrink-0">
                    x={Math.round(field.field_metadata.x)} y={Math.round(field.field_metadata.y)} {Math.round(field.field_metadata.fontSize)}pt
                  </span>
                )}

                {field.field_metadata && (
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <span className="text-xs text-ink-muted">Color</span>
                    <div className="w-5 h-5 rounded border border-border shrink-0" style={{ backgroundColor: field.field_metadata.color ?? '#000000' }} />
                    <input
                      type="color"
                      value={field.field_metadata.color ?? '#000000'}
                      onChange={e => updateFieldMeta(index, 'color', e.target.value)}
                      className="sr-only"
                    />
                  </label>
                )}

                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <span className="text-xs text-ink-muted shrink-0">Alineación</span>
                  <div className="flex rounded-lg border border-border overflow-hidden flex-1">
                    {[
                      { value: 'left',   label: 'Izq' },
                      { value: 'center', label: 'Centro' },
                      { value: 'right',  label: 'Der' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateFieldMeta(index, 'textAlign', value)}
                        className={`flex-1 py-1 text-xs font-medium transition-colors border-r last:border-r-0 border-border ${
                          (field.field_metadata?.textAlign ?? 'left') === value
                            ? 'bg-accent text-white'
                            : 'bg-white text-ink-muted hover:bg-surface'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Row 3: default value */}
            {field.field_type !== 'qr' && (
              <div className="mt-3 pt-3 border-t border-border">
                <Input
                  label="Valor por defecto"
                  value={field.field_metadata?.default_value ?? ''}
                  onChange={e => updateFieldMeta(index, 'default_value', e.target.value)}
                  placeholder="Opcional — se pre-completa para el cliente"
                />
              </div>
            )}

            {/* Row 4: field font */}
            {field.field_type !== 'qr' && (
              <div className="mt-3 pt-3 border-t border-border">
                <FontSelector
                  label="Fuente del campo"
                  placeholder="Sin fuente (hereda de plantilla)"
                  value={field.field_metadata?.font_id ?? null}
                  onChange={fontId => updateFieldMeta(index, 'font_id', fontId)}
                  fonts={fonts}
                  onFontsUpdate={setFonts}
                />
              </div>
            )}

          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addField}>
        + Agregar campo
      </Button>
    </div>
  )
}
