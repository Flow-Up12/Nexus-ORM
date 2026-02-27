import type { SchemaData } from '@/types/schema'
import { API_BASE } from '@/App'

export async function fetchSchema(): Promise<SchemaData> {
  const res = await fetch(`${API_BASE}/schema`)
  if (!res.ok) throw new Error('Failed to fetch schema')
  const json = await res.json()
  return json.data
}

export async function fetchSchemaRaw(): Promise<string> {
  const res = await fetch(`${API_BASE}/schema/raw`)
  if (!res.ok) throw new Error('Failed to fetch raw schema')
  const json = await res.json()
  return json.content
}

export async function saveSchemaRaw(content: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/schema/raw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to save schema')
  return json
}

export async function generateClient(): Promise<{ success: boolean; output?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/schema/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to generate')
  return json
}

export async function runMigration(name: string): Promise<{ success: boolean; output?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/schema/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to run migration')
  return json
}

export interface MigrationInfo {
  name: string
  timestamp: string
  label: string
  sql: string
}

export async function fetchMigrations(): Promise<{ migrations: MigrationInfo[] }> {
  const res = await fetch(`${API_BASE}/schema/migrations`)
  if (!res.ok) throw new Error('Failed to fetch migrations')
  const json = await res.json()
  return json
}
