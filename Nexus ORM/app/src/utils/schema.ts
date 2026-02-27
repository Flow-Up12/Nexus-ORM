import type { ParsedField, SchemaData } from '@/types/schema'

export function isRelationField(field: ParsedField, schema: SchemaData): boolean {
  const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '')
  return (
    field.type.includes('@relation') ||
    (schema?.parsed?.models?.some((m) => m.name === baseType) ?? false)
  )
}

export function getRelationTargetModel(field: ParsedField): string {
  return field.type.split(' ')[0].replace('[]', '').replace('?', '')
}

export function formatRelationDisplay(
  rel: Record<string, unknown> | Record<string, unknown>[] | null,
  isArray: boolean
): string {
  if (rel == null) return '—'
  if (isArray && Array.isArray(rel)) {
    return rel.length ? `${rel.length} item(s)` : '—'
  }
  if (typeof rel === 'object' && !Array.isArray(rel)) {
    const r = rel as Record<string, unknown>
    const parts = ['street', 'city', 'state', 'zipCode', 'name', 'accountNumber']
      .filter((k) => r[k] != null && r[k] !== '')
      .map((k) => String(r[k]))
    if (parts.length) return parts.join(', ')
    if (r.id != null) return `#${r.id}`
  }
  return '—'
}
