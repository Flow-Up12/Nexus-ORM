import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { Card, Button, Input } from '@/ui'

const API_BASE = '/ufo-studio/api'

async function fetchProject(id: string) {
  const token = localStorage.getItem('ufoStudioToken')
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch project')
  return res.json()
}

async function inviteUser(projectId: string, email: string, role: string) {
  const token = localStorage.getItem('ufoStudioToken')
  const res = await fetch(`${API_BASE}/projects/${projectId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ email, role }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to invite')
  }
  return res.json()
}

export function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId!),
    enabled: !!projectId,
  })

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      inviteUser(projectId!, data.email, data.role),
    onSuccess: (data) => {
      setInviteLink(data.inviteLink)
      setEmail('')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Email is required')
      return
    }
    inviteMutation.mutate({ email: trimmed, role })
  }

  if (!projectId || isLoading) return null

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {project?.name} Settings
      </h1>

      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite by email
        </h2>
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-600"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Button type="submit" variant="primary" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? 'Sending...' : 'Send invitation'}
          </Button>
        </form>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {inviteLink && (
          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Copy this link to share (email not sent yet):
            </p>
            <code className="text-sm break-all">{inviteLink}</code>
          </div>
        )}
      </Card>
    </div>
  )
}
