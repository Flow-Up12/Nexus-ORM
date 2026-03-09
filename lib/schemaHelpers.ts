import fs from "fs"
import path from "path"
import { getSchemaDir } from "./schemaContext.js"

export function getAllPrismaFiles(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  list.forEach(function (file) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPrismaFiles(filePath))
    } else if (file.endsWith(".prisma")) {
      results.push(filePath)
    }
  })
  return results
}

export function getFullSchema(): string {
  const baseDir = getSchemaDir()
  let files = getAllPrismaFiles(baseDir)
  files = files.sort((a, b) => {
    if (a.endsWith("schema.prisma")) return -1
    if (b.endsWith("schema.prisma")) return 1
    if (a.endsWith("enums.prisma")) return -1
    if (b.endsWith("enums.prisma")) return 1
    return a.localeCompare(b)
  })
  let content = ""
  for (const file of files) {
    content += fs.readFileSync(file, "utf-8") + "\n"
  }
  return content
}

export function parseSchema(schema: string): { models: any[]; enums: any[] } {
  const models: any[] = []
  const enums: any[] = []
  const lines = schema.split("\n")

  let currentModel: any = null
  let currentEnum: any = null
  let inModel = false
  let inEnum = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith("model ")) {
      inModel = true
      inEnum = false
      const modelName = trimmed.split(" ")[1]
      currentModel = {
        name: modelName,
        fields: [],
        attributes: [],
      }
    } else if (trimmed.startsWith("enum ")) {
      inEnum = true
      inModel = false
      const enumName = trimmed.split(" ")[1]
      currentEnum = {
        name: enumName,
        values: [],
      }
    } else if (trimmed === "}") {
      if (inModel && currentModel) {
        models.push(currentModel)
        currentModel = null
      } else if (inEnum && currentEnum) {
        enums.push(currentEnum)
        currentEnum = null
      }
      inModel = false
      inEnum = false
    } else if (inModel && currentModel && trimmed && !trimmed.startsWith("//")) {
      if (trimmed.startsWith("@@")) {
        currentModel.attributes.push(trimmed)
      } else {
        const fieldMatch = trimmed.match(/^(\w+)\s+(.+)$/)
        if (fieldMatch) {
          const [, name, type] = fieldMatch
          currentModel.fields.push({
            name,
            type: type.trim(),
            raw: trimmed,
          })
        }
      }
    } else if (inEnum && currentEnum && trimmed && !trimmed.startsWith("//")) {
      currentEnum.values.push(trimmed)
    }
  }

  return { models, enums }
}
