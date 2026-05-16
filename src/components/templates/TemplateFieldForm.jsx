import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { generateQrDataUrl } from '@/lib/qrGenerator'

export default function TemplateFieldForm({ fields, initialValues = {}, onChange }) {
  const [values, setValues] = useState(initialValues)
  const [qrPreviews, setQrPreviews] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    onChange?.(values)
  }, [values])

  function set(key, value) {
    setValues(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  async function handleQrPreview(key, url) {
    set(key, url)
    if (!url) {
      setQrPreviews(prev => ({ ...prev, [key]: null }))
      return
    }
    try {
      const dataUrl = await generateQrDataUrl(url)
      setQrPreviews(prev => ({ ...prev, [key]: dataUrl }))
    } catch {
      setQrPreviews(prev => ({ ...prev, [key]: null }))
    }
  }

  function validate() {
    const newErrors = {}
    for (const field of fields) {
      if (field.required && !values[field.field_key]?.trim?.()) {
        newErrors[field.field_key] = 'Este campo es obligatorio.'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Expose validate function to parent via a ref-like pattern
  TemplateFieldForm.validate = validate

  const sortedFields = [...fields].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-5">
      {sortedFields.map(field => (
        <FieldInput
          key={field.id}
          field={field}
          value={values[field.field_key] ?? ''}
          error={errors[field.field_key]}
          qrPreview={qrPreviews[field.field_key]}
          onChange={val => {
            if (field.field_type === 'qr') {
              handleQrPreview(field.field_key, val)
            } else {
              set(field.field_key, val)
            }
          }}
        />
      ))}
    </div>
  )
}

function FieldInput({ field, value, error, qrPreview, onChange }) {
  const { label, field_type, required } = field

  if (field_type === 'textarea') {
    return (
      <Textarea
        label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        error={error}
        rows={3}
      />
    )
  }

  if (field_type === 'date') {
    return (
      <Input
        label={label}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        error={error}
      />
    )
  }

  if (field_type === 'qr') {
    return (
      <div className="flex flex-col gap-1">
        <Input
          label={label}
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          error={error}
          placeholder="https://ejemplo.com"
          helperText="Se generará un código QR con esta URL"
        />
        {qrPreview && (
          <div className="mt-2 p-3 bg-surface border border-border rounded-lg inline-flex">
            <img src={qrPreview} alt="QR preview" className="w-24 h-24" />
          </div>
        )}
      </div>
    )
  }

  return (
    <Input
      label={label}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      error={error}
    />
  )
}
