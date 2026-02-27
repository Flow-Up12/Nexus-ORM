import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { fetchSettings, saveSettings } from '@/api/settings'
import type { Settings } from '@/api/settings'
import { Input, Button, Card, Select, Checkbox } from '@/ui'
import { useMutationWithToast } from '@/hooks'

export function Settings() {
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

  if (isLoading) return null

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
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
