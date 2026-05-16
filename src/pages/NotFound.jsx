import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function NotFound() {
  const { profile } = useAuth()
  const home = profile?.role === 'admin' ? '/admin' : '/dashboard'

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-semibold text-border mb-4">404</p>
        <h1 className="text-xl font-semibold text-ink mb-2">Página no encontrada</h1>
        <p className="text-sm text-ink-muted mb-6">La página que buscás no existe o fue movida.</p>
        <Link
          to={home}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
