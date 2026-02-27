import { API_BASE } from '@/App'

export interface Settings {
  theme?: string
  itemsPerPage?: number
  autoRefresh?: boolean
  refreshInterval?: number
  showRelationships?: boolean
  compactMode?: boolean
  notifications?: boolean
}

export async function fetchSettings(): Promise<Settings> {
  const res = await fetch(`${API_BASE}/settings`)
  if (!res.ok) throw new Error('Failed to fetch settings')
  const json = await res.json()
  return json.data
}

export async function saveSettings(settings: Settings): Promise<{ success: boolean; data: Settings }> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to save settings')
  return json
}
