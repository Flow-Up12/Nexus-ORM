import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Plus, Settings } from 'lucide-react'
import { Card, Button, Input } from '@/ui'
import { useAuth } from '@/context/AuthContext'

const API_BASE = '/ufo-studio/api'

async function fetchProjects() {
  const token = localStorage.getItem('ufoStudioToken')
  const res = await fetch(`${API_BASE}/projects`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}

async function createProject(name: string) {
  const token = localStorage.getItem('ufoStudioToken')
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to create project')
  }
  return res.json()
}

export function ProjectsDashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setNewName('')
      setError('')
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const name = newName.trim()
    if (!name) {
      setError('Project name is required')
      return
    }
    createMutation.mutate(name)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Create and manage your database projects
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Create project</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </form>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-600">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Your projects</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No projects yet. Create one above.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {projects.map((p: { id: string; name: string; role: string; owner: string }) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-4">
                  <Database className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {p.role} · by {p.owner}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/project/${p.id}/settings`}>
                    <Button variant="secondary" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={`/project/${p.id}`}>
                    <Button variant="primary" size="sm">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
