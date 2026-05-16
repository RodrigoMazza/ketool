import { useEffect, useState } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAllClients, createClient, getClientUsers } from '@/services/clients'
import { supabase } from '@/services/supabase'

// Dedicated client for creating new auth users from the admin panel.
// persistSession:false + autoRefreshToken:false ensure that signUp() does NOT
// write the new user's session to localStorage, so the admin's own session
// is never replaced. This is the no-CLI alternative to the Edge Function.
const signupClient = createSupabaseClient(
  (window.__EXTRANET_CONFIG__ || {}).SUPABASE_URL,
  (window.__EXTRANET_CONFIG__ || {}).SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Spinner from '@/components/ui/Spinner'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState({}) // { clientId: [] }
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create client modal
  const [showCreateClient, setShowCreateClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)

  // Create user modal
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [targetClientId, setTargetClientId] = useState(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [userError, setUserError] = useState('')

  useEffect(() => {
    getAllClients()
      .then(data => setClients(data ?? []))
      .catch(err => setError(err.message || 'Error al cargar clientes'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleExpand(clientId) {
    if (expanded === clientId) {
      setExpanded(null)
      return
    }
    setExpanded(clientId)
    if (!users[clientId]) {
      const u = await getClientUsers(clientId).catch(() => [])
      setUsers(prev => ({ ...prev, [clientId]: u }))
    }
  }

  async function handleCreateClient(e) {
    e.preventDefault()
    if (!newClientName.trim()) return
    setCreatingClient(true)
    try {
      const client = await createClient(newClientName.trim())
      setClients(prev => [...prev, client])
      setNewClientName('')
      setShowCreateClient(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingClient(false)
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    setUserError('')
    if (!newUserEmail.trim() || !newUserPassword.trim()) return
    setCreatingUser(true)
    try {
      // Step 1: create the auth user via the isolated signupClient.
      // Because persistSession:false, this signUp() never touches the admin's
      // localStorage session — no logout side-effect.
      const { data, error: signUpErr } = await signupClient.auth.signUp({
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
      })
      if (signUpErr) throw signUpErr
      if (!data.user) throw new Error('signUp no retornó el usuario — verificá que la confirmación de email esté desactivada en Supabase Auth settings.')

      // Step 2: insert the profile row using the admin's main client.
      // The admin_all_users policy (JWT app_metadata) allows this INSERT.
      const { error: insertErr } = await supabase.from('users').insert({
        id: data.user.id,
        email: newUserEmail.trim(),
        role: 'client',
        client_id: targetClientId,
      })
      if (insertErr) throw insertErr

      const u = await getClientUsers(targetClientId)
      setUsers(prev => ({ ...prev, [targetClientId]: u }))
      setNewUserEmail('')
      setNewUserPassword('')
      setShowCreateUser(false)
    } catch (err) {
      setUserError(err.message)
    } finally {
      setCreatingUser(false)
    }
  }

  function openCreateUser(clientId) {
    setTargetClientId(clientId)
    setNewUserEmail('')
    setNewUserPassword('')
    setUserError('')
    setShowCreateUser(true)
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        action={
          <Button size="sm" onClick={() => setShowCreateClient(true)}>
            + Nuevo cliente
          </Button>
        }
      />

      <ErrorMessage message={error} className="mb-4" />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6 text-accent" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No hay clientes"
          description="Creá tu primer cliente para comenzar."
          action={<Button size="sm" onClick={() => setShowCreateClient(true)}>Crear cliente</Button>}
        />
      ) : (
        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{client.name}</h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {users[client.id]?.length ?? '—'} usuario{users[client.id]?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openCreateUser(client.id)}>
                    + Usuario
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(client.id)}>
                    {expanded === client.id ? 'Cerrar' : 'Ver usuarios'}
                  </Button>
                </div>
              </div>

              {expanded === client.id && (
                <div className="border-t border-border">
                  {!users[client.id] ? (
                    <div className="flex justify-center py-6">
                      <Spinner className="w-5 h-5 text-accent" />
                    </div>
                  ) : users[client.id].length === 0 ? (
                    <p className="text-sm text-ink-muted text-center py-6">
                      Este cliente no tiene usuarios.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-surface">
                          <th className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">Email</th>
                          <th className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">Rol</th>
                          <th className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">Creado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users[client.id].map(u => (
                          <tr key={u.id} className="hover:bg-surface/50">
                            <td className="px-5 py-3 text-ink">{u.email}</td>
                            <td className="px-5 py-3 text-ink-muted">{u.role}</td>
                            <td className="px-5 py-3 text-ink-muted">
                              {new Date(u.created_at).toLocaleDateString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create client modal */}
      <Modal isOpen={showCreateClient} onClose={() => setShowCreateClient(false)} title="Nuevo cliente">
        <form onSubmit={handleCreateClient} className="space-y-4">
          <Input
            label="Nombre de la empresa"
            value={newClientName}
            onChange={e => setNewClientName(e.target.value)}
            required
            placeholder="Empresa S.A."
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateClient(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creatingClient}>
              Crear cliente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create user modal */}
      <Modal isOpen={showCreateUser} onClose={() => setShowCreateUser(false)} title="Nuevo usuario">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <ErrorMessage message={userError} />
          <p className="text-sm text-ink-muted">
            Cliente: <strong>{clients.find(c => c.id === targetClientId)?.name}</strong>
          </p>
          <Input
            label="Email"
            type="email"
            value={newUserEmail}
            onChange={e => setNewUserEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Contraseña temporal"
            type="password"
            value={newUserPassword}
            onChange={e => setNewUserPassword(e.target.value)}
            required
            helperText="El usuario puede cambiarla desde su perfil."
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateUser(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creatingUser}>
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
