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

export interface SchemaFileInfo {
  path: string
  name: string
}

export async function fetchSchemaFiles(): Promise<SchemaFileInfo[]> {
  const res = await fetch(`${API_BASE}/schema/files`)
  if (!res.ok) throw new Error('Failed to fetch schema files')
  const json = await res.json()
  return json.data
}

export async function fetchSchemaFile(filePath: string): Promise<string> {
  const res = await fetch(`${API_BASE}/schema/file?path=${encodeURIComponent(filePath)}`)
  if (!res.ok) throw new Error('Failed to fetch file')
  const json = await res.json()
  return json.content
}

export async function saveSchemaFile(filePath: string, content: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/schema/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to save file')
  return json
}

export async function parseSchemaContent(content: string): Promise<{ models: any[]; enums: any[] }> {
  const res = await fetch(`${API_BASE}/schema/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to parse schema')
  return json.data
}

export async function validateSchema(): Promise<{ valid: boolean; errors?: string }> {
  const res = await fetch(`${API_BASE}/schema/validate`, { method: 'POST' })
  const json = await res.json()
  return json
}

export async function fetchAllSchemaFileContents(): Promise<{ files: Array<{ path: string; name: string; content: string }> }> {
  const res = await fetch(`${API_BASE}/schema/files/contents`)
  if (!res.ok) throw new Error('Failed to fetch file contents')
  const json = await res.json()
  return json.data
}

export async function fetchModelFiles(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/schema/models`)
  if (!res.ok) throw new Error('Failed to fetch model files')
  const json = await res.json()
  return json.data || {}
}
