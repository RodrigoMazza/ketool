import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'

function isNew(createdAt) {
  const created = new Date(createdAt)
  const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}

export default function TemplateCard({ template }) {
  const { id, name, thumbnail_url, categories, created_at } = template

  return (
    <Link
      to={`/template/${id}`}
      className="group flex flex-col rounded-xl border border-border bg-white overflow-hidden hover:border-accent/40 hover:shadow-md transition-all"
    >
      <div className="relative aspect-square bg-surface overflow-hidden flex items-center justify-center">
        {thumbnail_url ? (
          <img
            src={thumbnail_url}
            alt={name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted/30">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        {isNew(created_at) && (
          <div className="absolute top-2 right-2">
            <Badge variant="new">Nueva</Badge>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-ink line-clamp-2">{name}</h3>
        {categories?.name && (
          <span className="text-xs text-ink-muted">{categories.name}</span>
        )}
      </div>
    </Link>
  )
}
