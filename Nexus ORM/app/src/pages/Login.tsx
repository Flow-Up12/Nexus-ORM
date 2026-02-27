import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Database } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = await login(username, password)
    if (ok) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Database className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nexus ORM</h1>
          <p className="text-slate-600">Database Manager</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Sign In
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Default: admin / admin123
        </p>
      </div>
    </div>
  )
}
