'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { ApiError } from '@/lib/api/client'
import { authApi, type Credentials, type Registration } from '@/lib/api/auth'
import type { User } from '@/lib/api/types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  login: (credentials: Credentials) => Promise<void>
  register: (registration: Registration) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setUser(await authApi.currentUser())
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null)
      } else {
        setError(cause instanceof Error ? cause.message : 'Unable to load your session.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
      setError(null)
    }
    window.addEventListener('nova:unauthorized', onUnauthorized)
    return () => window.removeEventListener('nova:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (credentials: Credentials) => {
    setError(null)
    setUser(await authApi.login(credentials))
  }, [])

  const register = useCallback(async (registration: Registration) => {
    setError(null)
    setUser(await authApi.register(registration))
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await authApi.logout()
      setUser(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign out.')
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, error, refresh, login, register, logout }),
    [user, loading, error, refresh, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, error, refresh, login, register } = useAuth()
  const [registering, setRegistering] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    setSubmitting(true)
    setFormError(null)
    try {
      if (registering) {
        await register({
          email,
          password,
          username: String(formData.get('name') ?? '').trim(),
        })
      } else {
        await login({ email, password })
      }
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="auth-page" role="status">
        <p>Checking your session…</p>
      </main>
    )
  }

  if (user) {
    return (
      <>
        {error && <p className="request-error auth-error" role="alert">{error}</p>}
        {children}
      </>
    )
  }

  if (error) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Unable to connect</h1>
          <p className="request-error" role="alert">{error}</p>
          <button className="primary" onClick={() => void refresh()}>Retry</button>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="brand-mark"><span /></span>
        <span className="eyebrow">NOVA workspace</span>
        <h1>{registering ? 'Create your account' : 'Welcome back'}</h1>
        {registering && (
          <label>
            Name
            <input name="name" autoComplete="name" required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={registering ? 'new-password' : 'current-password'}
            required
          />
        </label>
        {formError && <p className="request-error" role="alert">{formError}</p>}
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : registering ? 'Register' : 'Log in'}
        </button>
        <button
          className="quiet"
          type="button"
          onClick={() => {
            setRegistering((value) => !value)
            setFormError(null)
          }}
        >
          {registering ? 'Already have an account? Log in' : 'Create an account'}
        </button>
      </form>
    </main>
  )
}
