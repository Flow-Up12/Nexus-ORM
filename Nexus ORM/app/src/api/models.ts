import { API_BASE } from '@/App'

export interface ModelField {
  name: string
  type: string
  required?: boolean
  unique?: boolean
}

export async function fetchModels(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/schema/models`)
  if (!res.ok) throw new Error('Failed to fetch models')
  const json = await res.json()
  return json.data
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/schema/categories`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  const json = await res.json()
  return json.data
}

export async function createModel(
  name: string,
  fields: ModelField[],
  category = 'models'
): Promise<{ success: boolean; filePath?: string }> {
  const res = await fetch(`${API_BASE}/schema/model`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, fields, category }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to create model')
  return json
}

export async function updateModel(
  modelName: string,
  fields: ModelField[]
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/schema/model/${modelName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to update model')
  return json
}

export async function deleteModel(modelName: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/schema/model/${modelName}`, {
    method: 'DELETE',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to delete model')
  return json
}

export async function moveModel(modelName: string, category: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/schema/model/${modelName}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to move model')
  return json
}
