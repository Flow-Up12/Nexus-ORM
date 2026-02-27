import { API_BASE } from '@/App'

export interface FieldData {
  name: string
  type: string
  relationMetadata?: {
    targetModel: string
    isArray: boolean
    isOneToOne?: boolean
    relationType?: string
    relationName?: string
    foreignKeyName?: string
  }
}

export async function addField(
  modelName: string,
  field: FieldData
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/schema/field`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelName, field }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to add field')
  return json
}

export async function updateField(
  modelName: string,
  oldFieldName: string,
  newField: FieldData
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/schema/field`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelName, oldFieldName, newField }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to update field')
  return json
}

export async function deleteField(
  modelName: string,
  fieldName: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/schema/field`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelName, fieldName }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to delete field')
  return json
}
