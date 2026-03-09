/**
 * Client-side Prisma schema parser - extracts models and enums from schema string.
 * Used for live schema display so the canvas works without relying on the parse API.
 */
export function parseSchemaClient(schema: string): { models: Array<{ name: string; fields: Array<{ name: string; type: string; raw?: string }>; attributes?: string[] }>; enums: Array<{ name: string; values: string[] }> } {
  const models: Array<{ name: string; fields: Array<{ name: string; type: string; raw?: string }>; attributes?: string[] }> = []
  const enums: Array<{ name: string; values: string[] }> = []
  const lines = schema.split('\n')

  let currentModel: { name: string; fields: Array<{ name: string; type: string; raw?: string }>; attributes: string[] } | null = null
  let currentEnum: { name: string; values: string[] } | null = null
  let inModel = false
  let inEnum = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('model ')) {
      inModel = true
      inEnum = false
      const modelName = trimmed.split(/\s+/)[1]
      currentModel = { name: modelName, fields: [], attributes: [] }
    } else if (trimmed.startsWith('enum ')) {
      inEnum = true
      inModel = false
      const enumName = trimmed.split(/\s+/)[1]
      currentEnum = { name: enumName, values: [] }
    } else if (trimmed === '}') {
      if (inModel && currentModel) {
        models.push(currentModel)
        currentModel = null
      } else if (inEnum && currentEnum) {
        enums.push(currentEnum)
        currentEnum = null
      }
      inModel = false
      inEnum = false
    } else if (inModel && currentModel && trimmed && !trimmed.startsWith('//')) {
      if (trimmed.startsWith('@@')) {
        currentModel.attributes.push(trimmed)
      } else {
        const fieldMatch = trimmed.match(/^(\w+)\s+(.+)$/)
        if (fieldMatch) {
          const [, name, type] = fieldMatch
          currentModel.fields.push({ name, type: type.trim(), raw: trimmed })
        }
      }
    } else if (inEnum && currentEnum && trimmed && !trimmed.startsWith('//')) {
      currentEnum.values.push(trimmed)
    }
  }

  return { models, enums }
}
