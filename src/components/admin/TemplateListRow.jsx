import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function TemplateListRow({ template, onToggleActive, onDelete }) {
  const clientCount = template.template_clients?.length ?? 0

  function handleDelete() {
    if (window.confirm(`¿Eliminar "${template.name}"? Esta acción no se puede deshacer.`)) {
      onDelete(template.id)
    }
  }

  return (
    <tr className="hover:bg-surface/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {template.thumbnail_url ? (
            <img
              src={template.thumbnail_url}
              alt=""
              className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-surface border border-border shrink-0" />
          )}
          <div>
            <div className="font-medium text-ink text-sm">{template.name}</div>
            {template.categories?.name && (
              <div className="text-xs text-ink-muted">{template.categories.name}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted">{clientCount} cliente{clientCount !== 1 ? 's' : ''}</td>
      <td className="px-4 py-3">
        <Badge variant={template.is_active ? 'active' : 'inactive'}>
          {template.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link to={`/admin/templates/${template.id}/edit`}>
            <Button variant="ghost" size="sm">Editar</Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(template.id, !template.is_active)}
          >
            {template.is_active ? 'Desactivar' : 'Activar'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:text-danger"
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  )
}
