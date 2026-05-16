import { Outlet, NavLink } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { useAuth } from '@/context/AuthContext'

export default function AdminShell() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-white px-4 h-12 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Extranet Admin</span>
        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <NavLink to="/admin" end className="hover:text-ink">Dashboard</NavLink>
          <NavLink to="/admin/templates" className="hover:text-ink">Plantillas</NavLink>
          <NavLink to="/admin/clients" className="hover:text-ink">Clientes</NavLink>
          <NavLink to="/admin/fonts" className="hover:text-ink">Fuentes</NavLink>
          <NavLink to="/admin/preview" className="hover:text-ink">Vista cliente</NavLink>
          <button onClick={signOut} className="hover:text-ink">Salir</button>
        </div>
      </div>

      <main className="flex-1 px-4 sm:px-6 py-8 md:py-8 mt-12 md:mt-0 min-w-0">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
