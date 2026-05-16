export default function StatsCard({ label, value, sublabel, icon }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-semibold text-ink mt-1">{value}</p>
          {sublabel && <p className="text-xs text-ink-muted mt-0.5">{sublabel}</p>}
        </div>
        {icon && (
          <div className="text-ink-muted/40 text-2xl">{icon}</div>
        )}
      </div>
    </div>
  )
}
