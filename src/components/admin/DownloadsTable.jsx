import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DownloadsTable({ downloads, showUser = false, onReDownload }) {
  if (!downloads.length) {
    return <p className="text-sm text-ink-muted text-center py-8">No hay descargas registradas.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Plantilla</th>
            {showUser && (
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Usuario</th>
            )}
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Fecha</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Formato</th>
            {onReDownload && (
              <th className="px-4 py-3 text-right font-medium text-ink-muted">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {downloads.map(d => (
            <tr key={d.id} className="hover:bg-surface/50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {d.templates?.thumbnail_url && (
                    <img
                      src={d.templates.thumbnail_url}
                      alt=""
                      className="w-8 h-8 rounded object-cover border border-border shrink-0"
                    />
                  )}
                  <Link
                    to={`/template/${d.template_id}`}
                    className="font-medium text-ink hover:text-accent transition-colors"
                  >
                    {d.templates?.name || '—'}
                  </Link>
                </div>
              </td>
              {showUser && (
                <td className="px-4 py-3 text-ink-muted">
                  {d.users?.email || '—'}
                  {d.users?.clients?.name && (
                    <div className="text-xs text-ink-muted/70">{d.users.clients.name}</div>
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatDate(d.created_at)}</td>
              <td className="px-4 py-3">
                <Badge variant={d.format}>{d.format.toUpperCase()}</Badge>
              </td>
              {onReDownload && (
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReDownload(d)}
                  >
                    Volver a descargar
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
