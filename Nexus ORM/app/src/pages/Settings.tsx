import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { fetchSettings, saveSettings } from '@/api/settings'
import type { Settings } from '@/api/settings'
import { Input, Button, Card, Select, Checkbox } from '@/ui'
import { useMutationWithToast } from '@/hooks'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/App'

export function Settings() {
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const [theme, setTheme] = useState('light')
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme ?? 'light')
      setItemsPerPage(settings.itemsPerPage ?? 25)
      setAutoRefresh(settings.autoRefresh ?? false)
      setRefreshInterval(settings.refreshInterval ?? 30)
    }
  }, [settings])

  const saveMutation = useMutationWithToast({
    mutationFn: (s: Settings) => saveSettings(s),
    invalidateKeys: [['settings']],
    successMessage: 'Settings saved',
    errorMessage: 'Failed to save',
  })

  const handleSave = () => {
    saveMutation.mutate({
      theme,
      itemsPerPage,
      autoRefresh,
      refreshInterval,
    })
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    const token = localStorage.getItem('ufoStudioToken')
    const res = await fetch(`${API_BASE}/auth/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: 'include',
    })
    if (res.ok) {
      await refreshUser()
    }
    e.target.value = ''
  }

  if (isLoading) return null

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>

      {user && (
        <Card className="space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
              {user.avatarPath ? (
                <img
                  src={`/ufo-studio/uploads/${user.avatarPath}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-slate-500">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">{user.username}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadAvatar}
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Change avatar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-6">
        <Select label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </Select>
        <Input
          label="Items per page"
          type="number"
          min={5}
          max={100}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        />
        <Checkbox
          label="Auto-refresh"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
        />
        <Input
          label="Refresh interval (seconds)"
          type="number"
          min={5}
          max={300}
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
        />
        <Button variant="primary" onClick={handleSave}>
          Save Settings
        </Button>
      </Card>
    </div>
  )
}
