import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const TOKEN_KEY = 'ufoStudioToken'

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  const isDev = import.meta.env.DEV || !import.meta.env.PROD
  const isAuthenticated = isDev || (token !== null && token === 'ufo-studio-token')

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (username === 'admin' && password === 'admin123') {
      const t = 'ufo-studio-token'
      localStorage.setItem(TOKEN_KEY, t)
      document.cookie = `ufoStudioToken=${t}; path=/; max-age=86400`
      setToken(t)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    document.cookie = 'ufoStudioToken=; path=/; max-age=0'
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
