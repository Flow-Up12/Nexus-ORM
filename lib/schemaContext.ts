import { AsyncLocalStorage } from "async_hooks"
import path from "path"

export const schemaContext = new AsyncLocalStorage<{ schemaDir: string; databaseUrl?: string }>()

export function getSchemaDir(): string {
  const ctx = schemaContext.getStore()
  if (ctx?.schemaDir) return ctx.schemaDir
  return path.join(process.cwd(), "prisma", "schema")
}

export function getProjectDatabaseUrl(): string | undefined {
  const ctx = schemaContext.getStore()
  return ctx?.databaseUrl
}
