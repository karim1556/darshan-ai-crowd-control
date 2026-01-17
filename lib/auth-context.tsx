"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'pilgrim' | 'admin' | 'police' | 'medical'

export interface AuthUser extends User {
  role?: UserRole
  full_name?: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  role: UserRole | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  hasAccess: (allowedRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper to sync session to cookies for middleware
function syncSessionToCookies(session: Session | null) {
  if (typeof document === 'undefined') return
  
  if (session) {
    // Set auth cookies that middleware can read
    const cookieValue = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    const maxAge = 60 * 60 * 24 * 7 // 7 days
    document.cookie = `sb-auth-token=${encodeURIComponent(session.access_token)}; path=/; max-age=${maxAge}; samesite=lax`
    document.cookie = `sb-refresh-token=${encodeURIComponent(session.refresh_token)}; path=/; max-age=${maxAge}; samesite=lax`
  } else {
    // Clear auth cookies
    document.cookie = 'sb-auth-token=; path=/; max-age=0'
    document.cookie = 'sb-refresh-token=; path=/; max-age=0'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      syncSessionToCookies(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      syncSessionToCookies(session)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }

      if (data) {
        const profileData = data as { role: string; full_name: string }
        setUser({ ...session?.user!, role: profileData.role as UserRole, full_name: profileData.full_name })
        setRole(profileData.role as UserRole)
      } else {
        // Profile doesn't exist yet, use default role
        if (session?.user) {
          setUser({ ...session.user, role: 'pilgrim' })
        } else {
          setUser(null)
        }
        setRole('pilgrim')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      })

      if (error) return { error }

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role
          } as any)

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signIn = async (email: string, password: string) => {
    // Helper to add a timeout so the UI doesn't hang indefinitely
    const withTimeout = <T,>(p: Promise<T>, ms = 15000) => {
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Auth request timed out')), ms))
      return Promise.race([p, timeout]) as Promise<T>
    }

    try {
      console.log('[Auth] signIn called for', email)
      const result = await withTimeout(supabase.auth.signInWithPassword({ email, password }))
      // result has shape { data, error }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyRes = result as any
      console.log('[Auth] signIn result', { error: anyRes.error })
      return { error: anyRes.error }
    } catch (error) {
      // Handle timeout specially to avoid noisy stack traces
      const e = error as Error
      if (e?.message && e.message.includes('timed out')) {
        console.warn('[Auth] signIn timeout:', e.message)
        return { error: new Error('Auth request timed out. Check network or Supabase configuration.') }
      }

      console.error('[Auth] signIn error', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      console.log('[Auth] signOut: initiating')
      const { error } = await supabase.auth.signOut()
      if (error) console.warn('[Auth] signOut error from supabase:', error)
    } catch (e) {
      console.error('[Auth] signOut unexpected error:', e)
    } finally {
      // Ensure local state and cookies are cleared even if supabase call fails
      syncSessionToCookies(null) // Clear auth cookies
      try {
        // Also clear Supabase client session in case
        // @ts-ignore
        if (supabase?.auth?.removeAllSessions) supabase.auth.removeAllSessions()
      } catch (e) {
        // ignore
      }
      setUser(null)
      setRole(null)
      setSession(null)
      console.log('[Auth] signOut: completed')
    }
  }

  const hasAccess = (allowedRoles: UserRole[]) => {
    if (!role) return false
    return allowedRoles.includes(role)
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      loading,
      signUp,
      signIn,
      signOut,
      hasAccess
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
