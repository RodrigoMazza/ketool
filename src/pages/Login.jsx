import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'

const ERROR_MAP = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'Email not confirmed': 'Confirmá tu email antes de ingresar.',
  'Too many requests': 'Demasiados intentos. Esperá unos minutos.',
}

function translateError(msg) {
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (msg?.includes(key)) return val
  }
  return msg || 'Ocurrió un error. Intentá de nuevo.'
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'reset'
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr

      // Fetch role from users table
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userRow?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/extranet/login`,
      })
      if (resetErr) throw resetErr
      setResetSent(true)
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 mb-4">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink">
            {mode === 'login' ? 'Ingresar' : 'Recuperar contraseña'}
          </h1>
          <p className="text-sm text-ink-muted mt-1">Portal de plantillas</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <ErrorMessage message={error} />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@empresa.com"
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <Button type="submit" className="w-full" loading={loading}>
                Ingresar
              </Button>
              <button
                type="button"
                onClick={() => { setMode('reset'); setError('') }}
                className="w-full text-center text-xs text-ink-muted hover:text-ink transition-colors mt-2"
              >
                Olvidé mi contraseña
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {resetSent ? (
                <div className="text-center py-2">
                  <div className="text-2xl mb-3">✉️</div>
                  <p className="text-sm text-ink font-medium">Revisá tu email</p>
                  <p className="text-xs text-ink-muted mt-1">
                    Te enviamos un link para restablecer tu contraseña.
                  </p>
                </div>
              ) : (
                <>
                  <ErrorMessage message={error} />
                  <p className="text-sm text-ink-muted">
                    Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
                  </p>
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="tu@empresa.com"
                  />
                  <Button type="submit" className="w-full" loading={loading}>
                    Enviar link
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setResetSent(false) }}
                className="w-full text-center text-xs text-ink-muted hover:text-ink transition-colors"
              >
                ← Volver al login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
