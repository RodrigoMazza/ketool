import { Outlet } from 'react-router-dom'
import ClientNav from './ClientNav'

export default function ClientShell() {
  return (
    <div className="min-h-screen bg-surface">
      <ClientNav />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
