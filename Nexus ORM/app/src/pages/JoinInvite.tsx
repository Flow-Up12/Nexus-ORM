import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Database } from 'lucide-react'
import { Button, Card } from '@/ui'

const API_BASE = '/ufo-studio/api'

export function JoinInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [invitation, setInvitation] = useState<{
    projectName: string
    inviter: string
    role: string
  } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }
    fetch(`${API_BASE}/invitations/${token}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          setError(data.message)
        } else {
          setInvitation(data)
        }
      })
      .catch(() => setError('Failed to load invitation'))
      .finally(() => setLoading(false))
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    setAccepting(true)
    const authToken = localStorage.getItem('ufoStudioToken')
    const res = await fetch(`${API_BASE}/invitations/${token}/accept`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      credentials: 'include',
    })
    const data = await res.json()
    if (res.ok) {
      navigate(`/project/${data.projectId}/schema/canvas`)
    } else {
      setError(data.message || 'Failed to accept')
    }
    setAccepting(false)
  }

  const handleDecline = async () => {
    if (!token) return
    const authToken = localStorage.getItem('ufoStudioToken')
    await fetch(`${API_BASE}/invitations/${token}/decline`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      credentials: 'include',
    })
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Database className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Invalid invitation</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">{error || 'This invitation link is invalid or expired.'}</p>
          <Button variant="primary" className="mt-6" onClick={() => navigate('/')}>
            Go to dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md text-center">
        <Database className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">You&apos;re invited</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          <strong>{invitation.inviter}</strong> invited you to collaborate on{' '}
          <strong>{invitation.projectName}</strong> as {invitation.role}.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
          You must be logged in to accept. Sign in with the email this invitation was sent to.
        </p>
        <Link to="/login" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          Sign in
        </Link>
        <div className="flex gap-3 mt-6 justify-center">
          <Button variant="secondary" onClick={handleDecline} disabled={accepting}>
            Decline
          </Button>
          <Button variant="primary" onClick={handleAccept} disabled={accepting}>
            {accepting ? 'Accepting...' : 'Accept'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
