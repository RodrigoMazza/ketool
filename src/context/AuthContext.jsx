import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = auth not yet initialized; null = no session; Session = logged in
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Effect 1: session tracking — callback MUST be synchronous, no Supabase calls.
  //
  // Root cause of the previous infinite spinner:
  // onAuthStateChange holds an exclusive internal lock (GoTrueClient._acquireLock,
  // lockAcquired=true) while invoking the callback. Any supabase.from().select()
  // inside the callback calls fetchWithAuth → getAccessToken → auth.getSession()
  // → _acquireLock again. The reentrant path queues behind pendingInLock, which
  // resolves only when the callback completes. The callback waits for the query.
  // The query waits for the lock. Classic promise-chain deadlock — fetch never
  // resolves, setLoading(false) never runs, spinner stays forever.
  //
  // The async overload of onAuthStateChange is @deprecated in @supabase/auth-js
  // precisely for this reason (GoTrueClient.ts line 3844).
  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Synchronous update only. No await, no supabase.from(), no getSession().
      if (mounted) setSession(session ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Derive a primitive so Effect 2 only re-runs when the signed-in user actually changes,
  // not on every TOKEN_REFRESHED event that produces a new session object reference.
  //   undefined  → INITIAL_SESSION not yet received (still initializing)
  //   null       → signed out
  //   string     → user ID of the signed-in user
  const userId = session === undefined ? undefined : (session?.user?.id ?? null)

  // Effect 2: profile loading — runs outside the auth lock, triggered by user identity changes.
  // supabase.from().select() is safe here because the lock was released before this
  // effect fires (React state update → re-render → effect → all microtasks from the
  // onAuthStateChange callback have long since settled).
  useEffect(() => {
    if (userId === undefined) return // still waiting for INITIAL_SESSION, keep loading=true

    let mounted = true

    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    async function loadProfile() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (!mounted) return
      setProfile(error ? null : data)
      setLoading(false)
    }

    loadProfile()
    return () => { mounted = false }
  }, [userId])

  async function signOut() {
    await supabase.auth.signOut()
    // onAuthStateChange fires SIGNED_OUT → setSession(null) → Effect 2 clears profile
  }

  return (
    // session ?? null: expose null (not undefined) to consumers during initialization
    <AuthContext.Provider value={{ session: session ?? null, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
