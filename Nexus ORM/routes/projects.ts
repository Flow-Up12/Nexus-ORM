import { exec } from "child_process"
import { promisify } from "util"
import express, { Router } from "express"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import { meta } from "../../lib/meta.js"
import { authMiddleware, type AuthenticatedRequest } from "../../lib/auth.js"
import { createProjectDatabase, initProjectSchemaDir } from "../../lib/projectDb.js"
import { sendInvitationEmail } from "../../lib/email.js"
import { schemaContext, getSchemaDir, getProjectDatabaseUrl } from "../../lib/schemaContext.js"
import { getFullSchema, getAllPrismaFiles, parseSchema } from "../../lib/schemaHelpers.js"

const router = Router()

router.use(authMiddleware)

// Project schema middleware: load project, verify membership, set schema context
async function projectSchemaMiddleware(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })
    const projectId = req.params.id
    if (!projectId) return res.status(400).json({ message: "Project ID required" })

    const member = await meta.projectMember.findFirst({
      where: { projectId, userId: req.user.id },
      include: { project: true },
    })

    if (!member) return res.status(404).json({ message: "Project not found" })
    if (!member.project.schemaDir || !member.project.databaseUrl) {
      return res.status(500).json({ message: "Project schema not initialized" })
    }

    schemaContext.run(
      { schemaDir: member.project.schemaDir, databaseUrl: member.project.databaseUrl },
      () => next()
    )
  } catch (err) {
    console.error("Project schema middleware error:", err)
    res.status(500).json({ message: "Failed to load project" })
  }
}

// Project-scoped schema routes (uses project's schema dir when context is set)
const schemaRoutes = Router()

schemaRoutes.get("/", (req, res) => {
  try {
    const schema = getFullSchema()
    const parsedSchema = parseSchema(schema)
    res.json({
      success: true,
      data: { raw: schema, parsed: parsedSchema },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to read schema",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.get("/raw", (req, res) => {
  try {
    const content = getFullSchema()
    res.json({ success: true, content })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load schema",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.post("/raw", (req, res) => {
  try {
    const { content } = req.body
    if (!content || typeof content !== "string") {
      return res.status(400).json({ success: false, message: "Schema content is required" })
    }
    const schemaPath = path.join(getSchemaDir(), "schema.prisma")
    fs.writeFileSync(schemaPath, content, "utf-8")
    res.json({ success: true, message: "Schema saved successfully" })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save schema",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.get("/models", (req, res) => {
  try {
    const baseDir = getSchemaDir()
    const files = getAllPrismaFiles(baseDir)
    const modelFiles: Record<string, string> = {}
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8")
      const lines = content.split("\n")
      for (const line of lines) {
        const modelMatch = line.match(/^model\s+(\w+)\s*\{/)
        if (modelMatch) {
          modelFiles[modelMatch[1]] = path.relative(process.cwd(), file)
        }
      }
    }
    res.json({ success: true, data: modelFiles })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get model files",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.get("/files", (req, res) => {
  try {
    const baseDir = getSchemaDir()
    const files = getAllPrismaFiles(baseDir)
    const data = files.map((f) => ({
      path: path.relative(process.cwd(), f),
      name: path.basename(f),
    }))
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to list schema files",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.get("/files/contents", (req, res) => {
  try {
    const baseDir = getSchemaDir()
    const files = getAllPrismaFiles(baseDir)
    const data = {
      files: files.map((f) => ({
        path: path.relative(process.cwd(), f),
        name: path.basename(f),
        content: fs.readFileSync(f, "utf-8"),
      })),
    }
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to read schema files",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.get("/file", (req, res) => {
  try {
    const filePath = req.query.path as string
    if (!filePath) {
      return res.status(400).json({ success: false, message: "path query parameter is required" })
    }
    const absolutePath = path.resolve(process.cwd(), filePath)
    const schemaDir = path.resolve(getSchemaDir())
    if (!absolutePath.startsWith(schemaDir)) {
      return res.status(403).json({ success: false, message: "Access denied" })
    }
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: "File not found" })
    }
    const content = fs.readFileSync(absolutePath, "utf-8")
    res.json({ success: true, content })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to read file",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.post("/file", (req, res) => {
  try {
    const { path: filePath, content } = req.body
    if (!filePath || typeof content !== "string") {
      return res.status(400).json({ success: false, message: "path and content are required" })
    }
    const absolutePath = path.resolve(process.cwd(), filePath)
    const schemaDir = path.resolve(getSchemaDir())
    if (!absolutePath.startsWith(schemaDir)) {
      return res.status(403).json({ success: false, message: "Access denied" })
    }
    const dir = path.dirname(absolutePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(absolutePath, content, "utf-8")
    res.json({ success: true, message: "File saved" })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save file",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.post("/parse", (req, res) => {
  try {
    const { content } = req.body
    if (!content || typeof content !== "string") {
      return res.status(400).json({ success: false, message: "content is required" })
    }
    const parsed = parseSchema(content)
    res.json({ success: true, data: parsed })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to parse schema",
      error: (error as Error).message,
    })
  }
})

schemaRoutes.post("/validate", async (req, res) => {
  try {
    const execAsync = promisify(exec)
    const schemaPath = getSchemaDir()
    const dbUrl = getProjectDatabaseUrl()
    const env = dbUrl ? { ...process.env, DATABASE_URL: dbUrl } : process.env
    try {
      await execAsync(`npx prisma validate --schema="${schemaPath}"`, { cwd: process.cwd(), env })
      res.json({ valid: true })
    } catch (error: any) {
      res.json({ valid: false, errors: error.stderr || error.stdout || error.message })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Validation failed",
      error: (error as Error).message,
    })
  }
})

router.use("/:id/schema", projectSchemaMiddleware, schemaRoutes)

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const memberships = await meta.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            owner: { select: { username: true } },
          },
        },
      },
    })

    const projects = memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      role: m.role,
      owner: m.project.owner.username,
    }))

    res.json(projects)
  } catch (err) {
    console.error("List projects error:", err)
    res.status(500).json({ message: "Failed to list projects" })
  }
})

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const { name } = req.body
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Project name is required" })
    }

    const project = await meta.project.create({
      data: {
        name: name.trim(),
        databaseUrl: "", // set below
        schemaDir: "", // set below
        ownerId: req.user.id,
      },
    })

    try {
      const databaseUrl = await createProjectDatabase(project.id)
      const schemaDir = initProjectSchemaDir(project.id)

      await meta.project.update({
        where: { id: project.id },
        data: { databaseUrl, schemaDir },
      })

      await meta.projectMember.create({
        data: {
          projectId: project.id,
          userId: req.user.id,
          role: "owner",
        },
      })

      const updated = await meta.project.findUnique({
        where: { id: project.id },
        include: { owner: { select: { username: true } } },
      })

      res.status(201).json(updated)
    } catch (dbErr) {
      await meta.project.delete({ where: { id: project.id } }).catch(() => {})
      console.error("Create project DB error:", dbErr)
      res.status(500).json({ message: "Failed to create project database" })
    }
  } catch (err) {
    console.error("Create project error:", err)
    res.status(500).json({ message: "Failed to create project" })
  }
})

router.get("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const member = await meta.projectMember.findFirst({
      where: { projectId: req.params.id, userId: req.user.id },
      include: {
        project: {
          include: { owner: { select: { username: true } } },
        },
      },
    })

    if (!member) return res.status(404).json({ message: "Project not found" })

    res.json({
      id: member.project.id,
      name: member.project.name,
      role: member.role,
      owner: member.project.owner.username,
    })
  } catch (err) {
    console.error("Get project error:", err)
    res.status(500).json({ message: "Failed to get project" })
  }
})

router.post("/:id/invite", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const member = await meta.projectMember.findFirst({
      where: { projectId: req.params.id, userId: req.user.id },
      include: { project: true },
    })

    if (!member || member.role !== "owner") {
      return res.status(403).json({ message: "Only owner can invite" })
    }

    const { email, role } = req.body
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email is required" })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invite = await meta.projectInvitation.upsert({
      where: {
        projectId_email: { projectId: req.params.id, email: email.trim().toLowerCase() },
      },
      create: {
        projectId: req.params.id,
        email: email.trim().toLowerCase(),
        role: role || "editor",
        token,
        expiresAt,
      },
      update: { token, expiresAt, role: role || "editor" },
    })

    const baseUrl = req.protocol + "://" + req.get("host") || "http://localhost:3001"
    const inviteLink = `${baseUrl}/ufo-studio/join?token=${token}`

    await sendInvitationEmail(invite.email, member.project.name, inviteLink)

    res.json({ inviteLink })
  } catch (err) {
    console.error("Invite error:", err)
    res.status(500).json({ message: "Failed to send invitation" })
  }
})

export default router
