export default function ClientAssignmentPanel({ clients, selectedIds, onChange }) {
  function toggle(clientId) {
    if (selectedIds.includes(clientId)) {
      onChange(selectedIds.filter(id => id !== clientId))
    } else {
      onChange([...selectedIds, clientId])
    }
  }

  if (!clients.length) {
    return <p className="text-sm text-ink-muted">No hay clientes creados todavía.</p>
  }

  return (
    <div className="space-y-2">
      {clients.map(client => (
        <label key={client.id} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={selectedIds.includes(client.id)}
            onChange={() => toggle(client.id)}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-ink group-hover:text-accent transition-colors">
            {client.name}
          </span>
        </label>
      ))}
    </div>
  )
}
