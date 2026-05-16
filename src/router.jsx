import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/ui/Spinner'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import TemplatePage from '@/pages/TemplatePage'
import Historial from '@/pages/Historial'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminTemplates from '@/pages/AdminTemplates'
import AdminTemplateNew from '@/pages/AdminTemplateNew'
import AdminTemplateEdit from '@/pages/AdminTemplateEdit'
import AdminClients from '@/pages/AdminClients'
import AdminFonts from '@/pages/AdminFonts'
import AdminClientPreview from '@/pages/AdminClientPreview'
import NotFound from '@/pages/NotFound'
import ClientShell from '@/components/layout/ClientShell'
import AdminShell from '@/components/layout/AdminShell'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Spinner className="w-6 h-6 text-accent" />
    </div>
  )
}

function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireAdmin() {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function RootRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootRedirect />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      element: <RequireAuth />,
      children: [
        {
          element: <ClientShell />,
          children: [
            { path: '/dashboard', element: <Dashboard /> },
            { path: '/template/:id', element: <TemplatePage /> },
            { path: '/historial', element: <Historial /> },
          ],
        },
        {
          element: <RequireAdmin />,
          children: [
            {
              element: <AdminShell />,
              children: [
                { path: '/admin', element: <AdminDashboard /> },
                { path: '/admin/templates', element: <AdminTemplates /> },
                { path: '/admin/templates/new', element: <AdminTemplateNew /> },
                { path: '/admin/templates/:id/edit', element: <AdminTemplateEdit /> },
                { path: '/admin/clients', element: <AdminClients /> },
                { path: '/admin/fonts', element: <AdminFonts /> },
                { path: '/admin/preview', element: <AdminClientPreview /> },
                { path: '/admin/preview/:id', element: <TemplatePage forcePreview={true} backUrl="/admin/preview" /> },
              ],
            },
          ],
        },
      ],
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ],
  { basename: '/' }
)
