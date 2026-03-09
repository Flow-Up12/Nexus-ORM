import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const TOKEN_KEY = 'ufoStudioToken'
const API_BASE = '/ufo-studio/api'

export interface User {
  id: string
  username: string
  email: string
  avatarPath?: string | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (emailOrUsername: string, password: string) => Promise<boolean>
  signup: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(true)

  const isDev = import.meta.env.DEV || !import.meta.env.PROD
  const isAuthenticated = isDev || token !== null

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY)
    if (!t) {
      setUser(null)
      return
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
        credentials: 'include',
      })
      if (res.ok) {
        const u = await res.json()
        setUser(u)
      } else {
        setToken(null)
        setUser(null)
        localStorage.removeItem(TOKEN_KEY)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      refreshUser()
    } else {
      setUser(null)
      setIsLoading(false)
    }
  }, [token, refreshUser])

  const login = useCallback(async (emailOrUsername: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem(TOKEN_KEY, data.token)
        document.cookie = `ufoStudioToken=${data.token}; path=/; max-age=604800`
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const signup = useCallback(async (username: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem(TOKEN_KEY, data.token)
        document.cookie = `ufoStudioToken=${data.token}; path=/; max-age=604800`
        return { ok: true }
      }
      return { ok: false, error: data.message || 'Signup failed' }
    } catch {
      return { ok: false, error: 'Signup failed' }
    }
  }, [])

  const logout = useCallback(() => {
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
    document.cookie = 'ufoStudioToken=; path=/; max-age=0'
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
