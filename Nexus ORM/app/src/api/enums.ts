import { API_BASE } from '@/App'

export async function createEnum(
  enumName: string,
  values: string[]
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/schema/enum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enumName, values }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to create enum')
  return json
}

export async function updateEnum(
  enumName: string,
  values: string[]
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/schema/enum/${enumName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to update enum')
  return json
}

export async function deleteEnum(enumName: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/schema/enum/${enumName}`, {
    method: 'DELETE',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to delete enum')
  return json
}
