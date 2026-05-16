import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllTemplates } from '@/services/templates'
import { getAllClients } from '@/services/clients'
import { getRecentDownloads, getDownloadStats } from '@/services/downloads'
import StatsCard from '@/components/admin/StatsCard'
import DownloadsTable from '@/components/admin/DownloadsTable'
import Spinner from '@/components/ui/Spinner'
import PageHeader from '@/components/layout/PageHeader'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ templates: 0, clients: 0, monthDownloads: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAllTemplates(),
      getAllClients(),
      getDownloadStats(),
      getRecentDownloads(10),
    ])
      .then(([templates, clients, monthDownloads, downloads]) => {
        setStats({
          templates: templates.filter(t => t.is_active).length,
          clients: clients.length,
          monthDownloads: monthDownloads ?? 0,
        })
        setRecent(downloads)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-6 h-6 text-accent" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general de la extranet" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard
          label="Plantillas activas"
          value={stats.templates}
          icon="📄"
        />
        <StatsCard
          label="Clientes"
          value={stats.clients}
          icon="🏢"
        />
        <StatsCard
          label="Descargas este mes"
          value={stats.monthDownloads}
          icon="⬇️"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">Últimas descargas</h2>
        </div>
        <DownloadsTable downloads={recent} showUser />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <Link
          to="/admin/templates"
          className="block p-4 rounded-xl border border-border bg-white hover:border-accent/40 hover:shadow-sm transition-all"
        >
          <div className="text-sm font-medium text-ink mb-1">Gestionar plantillas →</div>
          <div className="text-xs text-ink-muted">Crear, editar y asignar plantillas</div>
        </Link>
        <Link
          to="/admin/clients"
          className="block p-4 rounded-xl border border-border bg-white hover:border-accent/40 hover:shadow-sm transition-all"
        >
          <div className="text-sm font-medium text-ink mb-1">Gestionar clientes →</div>
          <div className="text-xs text-ink-muted">Clientes y usuarios del portal</div>
        </Link>
      </div>
    </div>
  )
}
