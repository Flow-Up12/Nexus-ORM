import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fetchSettings, saveSettings } from '@/api/settings'
import type { Settings } from '@/api/settings'

export function Settings() {
  const queryClient = useQueryClient()
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

  const saveMutation = useMutation({
    mutationFn: (s: Settings) => saveSettings(s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings saved')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to save'),
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
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Items per page</label>
          <input
            type="number"
            min={5}
            max={100}
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
        <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span className="text-sm">Auto-refresh</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Refresh interval (seconds)</label>
          <input
            type="number"
            min={5}
            max={300}
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
