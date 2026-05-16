import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ClientNav() {
  const { profile, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-ink tracking-tight">Extranet</span>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface'
                  }`
                }
              >
                Inicio
              </NavLink>
              <NavLink
                to="/historial"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface'
                  }`
                }
              >
                Historial
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {profile?.email && (
              <span className="hidden sm:block text-xs text-ink-muted truncate max-w-[160px]">
                {profile.email}
              </span>
            )}
            <button
              onClick={signOut}
              className="text-xs text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
