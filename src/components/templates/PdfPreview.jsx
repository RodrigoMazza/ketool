export default function PdfPreview({ pdfUrl, thumbnail, activeField, pdfDimensions }) {
  if (!pdfUrl) return null

  let arrowX = 0
  let arrowY = 0
  let showArrow = false

  if (activeField && pdfDimensions) {
    const { width: pdfWidth, height: pdfHeight } = pdfDimensions
    if (activeField.field_type === 'qr') {
      const x = activeField.qr_x || 0
      const y = activeField.qr_y || 0
      const size = activeField.qr_size || 80
      arrowX = (x + size / 2) / pdfWidth * 100
      arrowY = (pdfHeight - (y + size / 2)) / pdfHeight * 100
      showArrow = true
    } else if (activeField.field_metadata) {
      const meta = activeField.field_metadata
      const pos = meta.positions?.[0] || meta
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        const x = pos.x
        const y = pos.y
        const w = pos.width || 100
        const h = pos.height || 12
        const align = meta.textAlign || 'left'

        if (align === 'center') {
          arrowX = (x + w / 2) / pdfWidth * 100
        } else if (align === 'right') {
          arrowX = (x + w) / pdfWidth * 100
        } else {
          arrowX = x / pdfWidth * 100
        }

        arrowY = (pdfHeight - (y + h / 2)) / pdfHeight * 100
        showArrow = true
      }
    }
  }

  const arrowStyle = showArrow ? {
    position: 'absolute',
    left: `${arrowX}%`,
    top: `${arrowY}%`,
    transform: 'translate(-50%, -100%)',
    zIndex: 10,
    pointerEvents: 'none',
  } : {}

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-ink">Vista previa</span>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline"
        >
          Abrir PDF original ↗
        </a>
      </div>
      <div className="relative">
        {thumbnail ? (
          <img src={thumbnail} alt="Vista previa de la plantilla" className="w-full" />
        ) : (
          <iframe
            src={pdfUrl}
            className="w-full h-96 border-0"
            title="Vista previa del PDF"
          />
        )}
        {showArrow && (
          <div style={arrowStyle}>
            <div className="animate-blink-arrow text-danger">
              <svg className="w-8 h-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21l-8-9h6V3h4v9h6l-8 9z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
