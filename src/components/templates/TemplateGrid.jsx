import TemplateCard from './TemplateCard'
import EmptyState from '@/components/ui/EmptyState'

export default function TemplateGrid({ templates }) {
  if (!templates.length) {
    return (
      <EmptyState
        icon="📄"
        title="No hay plantillas disponibles"
        description="No encontramos plantillas que coincidan con tu búsqueda."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {templates.map(t => (
        <TemplateCard key={t.id} template={t} />
      ))}
    </div>
  )
}
