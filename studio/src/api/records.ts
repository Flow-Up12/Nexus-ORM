import { API_BASE } from '@/App'

export interface RecordsResponse<T> {
  data: T[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface RecordParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  populate?: string
  [key: string]: string | number | undefined
}

export async function fetchRecords<T = Record<string, unknown>>(
  modelName: string,
  params: RecordParams = {}
): Promise<RecordsResponse<T>> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') searchParams.set(k, String(v))
  })
  const qs = searchParams.toString()
  const url = `${API_BASE}/v1/${modelName}${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch records: ${res.statusText}`)
  return res.json()
}

export async function fetchRecord<T = Record<string, unknown>>(
  modelName: string,
  id: number | string,
  populate?: string
): Promise<{ data: T }> {
  const url = `${API_BASE}/v1/${modelName}/${id}${populate ? `?populate=${populate}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch record: ${res.statusText}`)
  return res.json()
}

export async function createRecord<T = Record<string, unknown>>(
  modelName: string,
  data: Record<string, unknown>
): Promise<{ data: T }> {
  const res = await fetch(`${API_BASE}/v1/${modelName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const msg = json.details ? `${json.message}: ${json.details}` : (json.message || `Failed to create record: ${res.statusText}`)
    throw new Error(msg)
  }
  return res.json()
}

export async function updateRecord<T = Record<string, unknown>>(
  modelName: string,
  id: number | string,
  data: Record<string, unknown>
): Promise<{ data: T }> {
  const res = await fetch(`${API_BASE}/v1/${modelName}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const msg = json.details ? `${json.message}: ${json.details}` : (json.message || `Failed to update record: ${res.statusText}`)
    throw new Error(msg)
  }
  return res.json()
}

export async function deleteRecord(
  modelName: string,
  id: number | string
): Promise<{ data: null }> {
  const res = await fetch(`${API_BASE}/v1/${modelName}/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Failed to delete record: ${res.statusText}`)
  return res.json()
}
