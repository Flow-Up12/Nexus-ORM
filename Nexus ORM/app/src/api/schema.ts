import type { SchemaData } from '@/types/schema'
import { API_BASE } from '@/App'

function schemaBase(projectId?: string | null): string {
  if (projectId) {
    return `${API_BASE}/projects/${projectId}/schema`
  }
  return `${API_BASE}/schema`
}

export async function fetchSchema(projectId?: string | null): Promise<SchemaData> {
  const res = await fetch(`${schemaBase(projectId)}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch schema')
  const json = await res.json()
  return json.data
}

export async function fetchSchemaRaw(projectId?: string | null): Promise<string> {
  const res = await fetch(`${schemaBase(projectId)}/raw`)
  if (!res.ok) throw new Error('Failed to fetch raw schema')
  const json = await res.json()
  return json.content
}

export async function saveSchemaRaw(content: string, projectId?: string | null): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${schemaBase(projectId)}/raw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to save schema')
  return json
}

export async function generateClient(projectId?: string | null): Promise<{ success: boolean; output?: string; error?: string }> {
  const res = await fetch(`${schemaBase(projectId)}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to generate')
  return json
}

export async function runMigration(name: string, projectId?: string | null): Promise<{ success: boolean; output?: string; error?: string }> {
  const res = await fetch(`${schemaBase(projectId)}/migrate`, {
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

export async function fetchMigrations(projectId?: string | null): Promise<{ migrations: MigrationInfo[] }> {
  const res = await fetch(`${schemaBase(projectId)}/migrations`)
  if (!res.ok) throw new Error('Failed to fetch migrations')
  const json = await res.json()
  return json
}

export interface SchemaFileInfo {
  path: string
  name: string
}

export async function fetchSchemaFiles(projectId?: string | null): Promise<SchemaFileInfo[]> {
  const res = await fetch(`${schemaBase(projectId)}/files`)
  if (!res.ok) throw new Error('Failed to fetch schema files')
  const json = await res.json()
  return json.data
}

export async function fetchSchemaFile(filePath: string, projectId?: string | null): Promise<string> {
  const res = await fetch(`${schemaBase(projectId)}/file?path=${encodeURIComponent(filePath)}`)
  if (!res.ok) throw new Error('Failed to fetch file')
  const json = await res.json()
  return json.content
}

export async function saveSchemaFile(filePath: string, content: string, projectId?: string | null): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${schemaBase(projectId)}/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to save file')
  return json
}

export async function parseSchemaContent(content: string, projectId?: string | null): Promise<{ models: any[]; enums: any[] }> {
  const res = await fetch(`${schemaBase(projectId)}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to parse schema')
  return json.data
}

export async function validateSchema(projectId?: string | null): Promise<{ valid: boolean; errors?: string }> {
  const res = await fetch(`${schemaBase(projectId)}/validate`, { method: 'POST' })
  const json = await res.json()
  return json
}

export async function fetchAllSchemaFileContents(projectId?: string | null): Promise<{ files: Array<{ path: string; name: string; content: string }> }> {
  const res = await fetch(`${schemaBase(projectId)}/files/contents`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch file contents')
  const json = await res.json()
  return json.data
}

export async function fetchModelFiles(projectId?: string | null): Promise<Record<string, string>> {
  const res = await fetch(`${schemaBase(projectId)}/models`)
  if (!res.ok) throw new Error('Failed to fetch model files')
  const json = await res.json()
  return json.data || {}
}
