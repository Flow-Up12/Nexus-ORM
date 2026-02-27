import { apiFetch } from './client'

export interface QueryResponse {
  success: boolean
  data: unknown
  rowCount: number
}

export interface QueryErrorResponse {
  success: false
  message: string
  details?: string
}

export async function runSqlQuery(sql: string): Promise<QueryResponse> {
  const res = await apiFetch('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  })
  const json = await res.json()
  if (!res.ok) {
    const err = json as QueryErrorResponse
    throw new Error(err.details || err.message || 'Query failed')
  }
  return json as QueryResponse
}

export interface SavedScript {
  name: string
  filename: string
}

export async function saveSqlScriptToServer(name: string, sql: string): Promise<{ success: boolean; path?: string }> {
  const res = await apiFetch('/query/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, sql }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error((json as QueryErrorResponse).message || 'Failed to save')
  return json
}

export async function listSqlScripts(): Promise<SavedScript[]> {
  const res = await apiFetch('/query/scripts')
  const json = await res.json()
  if (!res.ok) throw new Error((json as QueryErrorResponse).message || 'Failed to list scripts')
  return (json as { data: SavedScript[] }).data ?? []
}

export async function loadSqlScriptFromServer(filename: string): Promise<{ name: string; sql: string }> {
  const res = await apiFetch(`/query/scripts/${encodeURIComponent(filename)}`)
  const json = await res.json()
  if (!res.ok) throw new Error((json as QueryErrorResponse).message || 'Failed to load script')
  return (json as { data: { name: string; sql: string } }).data
}
