import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, velouraDb } from '../lib/supabase'

type AuthResult = { ok: true; message?: string } | { ok: false; message: string }

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  recoveryMode: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthState | null>(null)

async function ensureProfile(user: User) {
  const displayName = String(user.user_metadata?.display_name || user.user_metadata?.full_name || '').trim()
  const { error } = await velouraDb().from('profiles').upsert({
    user_id: user.id,
    email: user.email ?? null,
    display_name: displayName || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode,setRecoveryMode] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
      if (data.session?.user) ensureProfile(data.session.user).catch(() => undefined)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if(event==='PASSWORD_RECOVERY') setRecoveryMode(true)
      if(event==='SIGNED_OUT') setRecoveryMode(false)
      setSession(nextSession)
      setLoading(false)
      if (nextSession?.user) queueMicrotask(() => ensureProfile(nextSession.user).catch(() => undefined))
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { ok: false, message: error.message }
    if (data.user) {
      try { await ensureProfile(data.user) } catch { /* sync layer will retry */ }
    }
    return { ok: true }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin + '/account' : undefined
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: redirectTo,
      },
    })
    if (error) return { ok: false, message: error.message }
    if (data.user && data.session) {
      try { await ensureProfile(data.user) } catch { /* sync layer will retry */ }
    }
    return {
      ok: true,
      message: data.session ? 'Account created and signed in.' : 'Account created. Check your email if confirmation is required.',
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin + '/login?recovery=1' : undefined
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    return error ? { ok: false, message: error.message } : { ok: true, message: 'Password reset email sent.' }
  }, [])

  const updatePassword = useCallback(async (password:string):Promise<AuthResult> => {
    if(password.length<8)return {ok:false,message:'Use at least 8 characters.'}
    const { error }=await supabase.auth.updateUser({password})
    if(error)return {ok:false,message:error.message}
    setRecoveryMode(false)
    return {ok:true,message:'Password updated.'}
  }, [])

  const value = useMemo<AuthState>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    recoveryMode,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
  }), [session, loading, recoveryMode, signIn, signUp, signOut, sendPasswordReset, updatePassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
