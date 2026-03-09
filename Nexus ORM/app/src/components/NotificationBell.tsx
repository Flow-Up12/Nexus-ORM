import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const API_BASE = '/ufo-studio/api'

interface Invitation {
  id: string
  token: string
  projectId: string
  projectName: string
  inviter: string
  role: string
}

export function NotificationBell() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return
    const token = localStorage.getItem('ufoStudioToken')
    fetch(`${API_BASE}/invitations/pending`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.ok ? res.json() : [])
      .then(setInvitations)
      .catch(() => setInvitations([]))
  }, [isAuthenticated, user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const accept = async (token: string) => {
    const authToken = localStorage.getItem('ufoStudioToken')
    const res = await fetch(`${API_BASE}/invitations/${token}/accept`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      credentials: 'include',
    })
    const data = await res.json()
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.token !== token))
      navigate(`/project/${data.projectId}/schema/canvas`)
    }
    setOpen(false)
  }

  const decline = async (token: string) => {
    const authToken = localStorage.getItem('ufoStudioToken')
    await fetch(`${API_BASE}/invitations/${token}/decline`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      credentials: 'include',
    })
    setInvitations((prev) => prev.filter((i) => i.token !== token))
  }

  if (!isAuthenticated) return null

  const count = invitations.length

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg z-50">
          <div className="p-3 border-b border-slate-200 dark:border-slate-600">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Invitations</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {invitations.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                No pending invitations
              </div>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">{inv.projectName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {inv.inviter} invited you as {inv.role}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => decline(inv.token)}
                      className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => accept(inv.token)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
