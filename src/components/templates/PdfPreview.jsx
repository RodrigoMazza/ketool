export default function PdfPreview({ pdfUrl, thumbnail }) {
  if (!pdfUrl) return null

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
      </div>
    </div>
  )
}
