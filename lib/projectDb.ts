import { Client } from "pg"
import fs from "fs"
import path from "path"

function getPoolConfig() {
  const dbUrl = process.env.DATABASE_URL
  if (process.env.PG_POOL_HOST || process.env.PG_POOL_USER) {
    return {
      host: process.env.PG_POOL_HOST || process.env.PGHOST || "localhost",
      port: parseInt(process.env.PG_POOL_PORT || process.env.PGPORT || "5432", 10),
      user: process.env.PG_POOL_USER || process.env.PGUSER || "postgres",
      password: String(process.env.PG_POOL_PASSWORD ?? process.env.PGPASSWORD ?? ""),
      database: process.env.PG_POOL_DEFAULT_DB || "postgres",
    }
  }
  if (dbUrl) {
    const url = new URL(dbUrl.replace(/^postgresql:/, "postgres:"))
    return {
      host: url.hostname || "localhost",
      port: parseInt(url.port || "5432", 10),
      user: url.username || "postgres",
      password: String(url.password || ""),
      database: url.pathname?.slice(1) || "postgres",
    }
  }
  return {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "",
    database: "postgres",
  }
}

function getPoolConnectionString(dbName?: string): string {
  const cfg = getPoolConfig()
  const db = dbName || cfg.database
  const enc = encodeURIComponent
  return `postgresql://${enc(cfg.user)}:${enc(cfg.password)}@${cfg.host}:${cfg.port}/${db}`
}

export async function createProjectDatabase(projectId: string): Promise<string> {
  const cfg = getPoolConfig()
  const dbName = `project_${projectId.replace(/-/g, "_")}`
  const client = new Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: "postgres",
  })
  await client.connect()
  try {
    await client.query(`CREATE DATABASE "${dbName}"`)
  } finally {
    await client.end()
  }
  return getPoolConnectionString(dbName)
}

export function getProjectSchemaDir(projectId: string): string {
  return path.join(process.cwd(), "data", "projects", projectId, "schema")
}

export function initProjectSchemaDir(projectId: string): string {
  const schemaDir = getProjectSchemaDir(projectId)
  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true })
  }
  const schemaPath = path.join(schemaDir, "schema.prisma")
  if (!fs.existsSync(schemaPath)) {
    const defaultSchema = `generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["prismaSchemaFolder"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`
    fs.writeFileSync(schemaPath, defaultSchema, "utf-8")
  }
  return schemaDir
}
