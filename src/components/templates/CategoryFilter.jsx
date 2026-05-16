export default function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === null
            ? 'bg-accent text-white'
            : 'bg-white border border-border text-ink-muted hover:text-ink hover:border-accent/40'
        }`}
      >
        Todas
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === cat.id
              ? 'bg-accent text-white'
              : 'bg-white border border-border text-ink-muted hover:text-ink hover:border-accent/40'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
