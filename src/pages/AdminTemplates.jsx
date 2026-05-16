import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllTemplates, toggleTemplateActive, deleteTemplate } from '@/services/templates'
import { deleteTemplateFiles } from '@/services/storage'
import TemplateListRow from '@/components/admin/TemplateListRow'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllTemplates()
      .then(setTemplates)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(id, newActive) {
    try {
      await toggleTemplateActive(id, newActive)
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: newActive } : t))
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTemplate(id)
      await deleteTemplateFiles(id).catch(() => {})
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`)
    }
  }

  return (
    <div>
      <PageHeader
        title="Plantillas"
        action={
          <Link to="/admin/templates/new">
            <Button size="sm">+ Nueva plantilla</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6 text-accent" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No hay plantillas"
          description="Creá tu primera plantilla para comenzar."
          action={
            <Link to="/admin/templates/new">
              <Button size="sm">Crear plantilla</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Plantilla</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Asignada a</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-ink-muted">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.map(t => (
                <TemplateListRow
                  key={t.id}
                  template={t}
                  onToggleActive={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
