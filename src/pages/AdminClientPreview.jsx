import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllClients } from '@/services/clients'
import { getTemplatesForClientDirect } from '@/services/templates'
import PageHeader from '@/components/layout/PageHeader'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminClientPreview() {
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [templates, setTemplates] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  useEffect(() => {
    getAllClients()
      .then(setClients)
      .catch(() => {})
      .finally(() => setLoadingClients(false))
  }, [])

  useEffect(() => {
    if (!clientId) { setTemplates([]); return }
    setLoadingTemplates(true)
    getTemplatesForClientDirect(clientId)
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false))
  }, [clientId])

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }))

  return (
    <div>
      <PageHeader
        title="Vista cliente"
        subtitle="Previsualizá plantillas exactamente como las ve el cliente"
      />

      <div className="mb-6 max-w-xs">
        {loadingClients ? (
          <Spinner className="w-5 h-5 text-accent" />
        ) : (
          <Select
            label="Cliente"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            options={clientOptions}
            placeholder="Seleccioná un cliente..."
          />
        )}
      </div>

      {!clientId ? (
        <EmptyState
          icon="👤"
          title="Seleccioná un cliente"
          description="Elegí un cliente para ver sus plantillas activas asignadas."
        />
      ) : loadingTemplates ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6 text-accent" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Sin plantillas"
          description="Este cliente no tiene plantillas activas asignadas."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map(t => (
            <Link
              key={t.id}
              to={`/admin/preview/${t.id}`}
              className="group flex flex-col rounded-xl border border-border bg-white overflow-hidden hover:border-accent/40 hover:shadow-md transition-all"
            >
              <div className="relative aspect-square bg-surface overflow-hidden flex items-center justify-center">
                {t.thumbnail_url ? (
                  <img
                    src={t.thumbnail_url}
                    alt={t.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-muted/30">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-ink line-clamp-2">{t.name}</h3>
                {t.categories?.name && (
                  <span className="text-xs text-ink-muted">{t.categories.name}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
