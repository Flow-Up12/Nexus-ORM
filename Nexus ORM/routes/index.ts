import { exec } from "child_process"
import { fileURLToPath } from "url"
import express, { Router } from "express"
import fs, { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import path, { join } from "path"
import { promisify } from "util"
import { Prisma } from "@prisma/client"
import { prisma } from "../../lib/prisma"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function handlePrismaError(error: unknown, res: express.Response, fallbackMessage: string) {
    if (error instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            message: "Validation failed",
            details: error.message,
        })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            return res.status(409).json({
                message: "A record with this value already exists",
                details: error.meta ? String(error.meta.target ?? error.message) : error.message,
            })
        }
        if (error.code === "P2003") {
            return res.status(400).json({
                message: "Invalid reference",
                details: error.message,
            })
        }
        return res.status(400).json({
            message: "Database error",
            details: error.message,
        })
    }
    console.error("Data operation error:", error)
    return res.status(500).json({
        message: fallbackMessage,
        details: error instanceof Error ? error.message : "Unknown error",
    })
}

const router = Router()

// Prefer new React app (Nexus ORM/app/dist) when built; fallback to legacy public
function getStudioPublicDir(): string {
  const appDist = path.join(__dirname, "../app/dist")
  if (fs.existsSync(appDist)) return appDist
  return path.join(__dirname, "../public")
}

// Prisma client uses camelCase for model access (e.g. BillingAddress -> billingAddress)
function getPrismaModelName(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

// Auth middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
    // Always bypass in development or when no NODE_ENV is set
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
        return next()
    }

    // Check for token in authorization header or cookie
    const authHeader = req.headers.authorization
    const token = authHeader?.split(" ")[1] || req.cookies?.ufoStudioToken

    if (!token || token !== "ufo-studio-token") {
        return res.status(401).json({ message: "Access denied" })
    }
    next()
}

// Login page
router.get("/login", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Database Manager Login</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body class="bg-gray-900">
            <div class="min-h-screen flex items-center justify-center">
                <div class="bg-white rounded-lg shadow-xl p-8 w-96">
                    <div class="text-center mb-8">
                        <i class="fas fa-database text-blue-500 text-4xl mb-4"></i>
                        <h1 class="text-2xl font-bold">Database Manager</h1>
                        <p class="text-gray-600">Professional Interface</p>
                    </div>
                    <form id="loginForm" class="space-y-6">
                        <input type="text" id="username" placeholder="Username" value="admin" 
                               class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                        <input type="password" id="password" placeholder="Password" value="admin123"
                               class="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                        <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md">
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
            <script>
                document.getElementById('loginForm').addEventListener('submit', (e) => {
                    e.preventDefault()
                    if (document.getElementById('username').value === 'admin' && 
                        document.getElementById('password').value === 'admin123') {
                        // Set both localStorage and cookie
                        localStorage.setItem('ufoStudioToken', 'ufo-studio-token')
                        document.cookie = 'ufoStudioToken=ufo-studio-token; path=/; max-age=86400'
                        window.location.href = '/ufo-studio'
                    } else {
                        alert('Invalid credentials')
                    }
                })
            </script>
        </body>
        </html>
    `)
})

// Legacy: Serve static JavaScript files (req.path is stripped to e.g. /app.js after /js prefix)
router.use("/js", (req, res) => {
    const legacyDir = path.join(__dirname, "../public")
    const filePath = path.join(legacyDir, "js", req.path.replace(/^\//, ""))
    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "application/javascript")
        res.sendFile(filePath)
    } else {
        res.status(404).send("File not found")
    }
})

// Helper functions for split schema management

// Helper to resolve Prisma schema directory path
function getSchemaDir(): string {
    return path.join(process.cwd(), "prisma", "schema")
}

// Helper to resolve Prisma schema.prisma file path
function getSchemaFilePath(): string {
    return path.join(getSchemaDir(), "schema.prisma")
}

// Helper to recursively get all .prisma files in a directory
function getAllPrismaFiles(dir: string): string[] {
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

// Helper to concatenate all .prisma files in a deterministic order
function getFullSchema(): string {
    const baseDir = getSchemaDir()
    let files = getAllPrismaFiles(baseDir)
    // Sort: schema.prisma first, then enums.prisma, then rest alphabetically
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

// Helper to find which file contains a specific model
function findModelFile(modelName: string): string | null {
    try {
        const baseDir = getSchemaDir()
        const files = getAllPrismaFiles(baseDir)

        for (const file of files) {
            const content = fs.readFileSync(file, "utf-8")
            if (content.includes(`model ${modelName}`)) {
                return file
            }
        }
        return null
    } catch {
        return null
    }
}

// Helper to create a new model file
function createModelFile(
    modelName: string,
    fields: any[],
    category: string = "models"
): string {
    const baseSchemaDir = getSchemaDir()
    const baseDir = path.join(baseSchemaDir, category)

    // Ensure directory exists
    if (!existsSync(baseDir)) {
        mkdirSync(baseDir, { recursive: true })
    }

    const filePath = path.join(baseDir, `${modelName}.prisma`)

    // Build model definition
    const modelContent = [
        `model ${modelName} {`,
        "  id Int @id @default(autoincrement())",
        ...fields.map((field) => {
            let fieldLine = `  ${field.name} ${field.type}`
            if (!field.required) fieldLine += "?"
            if (field.unique) fieldLine += " @unique"
            return fieldLine
        }),
        "  createdAt DateTime @default(now())",
        "  updatedAt DateTime @updatedAt",
        "}",
        "",
    ].join("\n")

    writeFileSync(filePath, modelContent, "utf-8")
    return filePath
}

// Helper to update a model file
function updateModelFile(modelName: string, fields: any[]): void {
    const filePath = findModelFile(modelName)
    if (!filePath) {
        throw new Error(`Model file for ${modelName} not found`)
    }

    const modelContent = [
        `model ${modelName} {`,
        "  id Int @id @default(autoincrement())",
        ...fields.map((field) => {
            let fieldLine = `  ${field.name} ${field.type}`
            if (!field.required) fieldLine += "?"
            if (field.unique) fieldLine += " @unique"
            return fieldLine
        }),
        "  createdAt DateTime @default(now())",
        "  updatedAt DateTime @updatedAt",
        "}",
        "",
    ].join("\n")

    writeFileSync(filePath, modelContent, "utf-8")
}

// Helper to delete a model file
function deleteModelFile(modelName: string): void {
    const filePath = findModelFile(modelName)
    if (filePath) {
        fs.unlinkSync(filePath)
    }
}

// Helper to add enum to enums.prisma (or create file if not exists)
function addEnumToFile(enumName: string, values: string[]): void {
    const enumsPath = path.join(getSchemaDir(), "enums.prisma")
    let content = existsSync(enumsPath) ? fs.readFileSync(enumsPath, "utf-8") : ""


    // Check if enum already exists
    if (content.includes(`enum ${enumName}`)) {
        throw new Error(`Enum ${enumName} already exists`)
    }

    // Add enum definition
    const enumDef = [
        "",
        `enum ${enumName} {`,
        ...values.map((value) => `  ${value}`),
        "}",
        "",
    ].join("\n")

    content += enumDef
    writeFileSync(enumsPath, content, "utf-8")
}

// Helper to update enum in enums.prisma
function updateEnumInFile(enumName: string, values: string[]): void {
    const enumsPath = path.join(getSchemaDir(), "enums.prisma")
    if (!existsSync(enumsPath)) throw new Error("enums.prisma not found")
    let content = fs.readFileSync(enumsPath, "utf-8")

    // Replace the enum definition
    const enumRegex = new RegExp(`enum\\s+${enumName}\\s*\\{[^}]*\\}`, "g")
    const newEnumDef = [
        `enum ${enumName} {`,
        ...values.map((value) => `  ${value}`),
        "}",
    ].join("\n")

    content = content.replace(enumRegex, newEnumDef)
    writeFileSync(enumsPath, content, "utf-8")
}

// Helper to delete enum from enums.prisma
function deleteEnumFromFile(enumName: string): void {
    const enumsPath = path.join(getSchemaDir(), "enums.prisma")
    if (!existsSync(enumsPath)) return
    let content = fs.readFileSync(enumsPath, "utf-8")

    // Remove the enum definition
    const enumRegex = new RegExp(
        `\\n*enum\\s+${enumName}\\s*\\{[^}]*\\}\\n*`,
        "g"
    )
    content = content.replace(enumRegex, "\n")

    writeFileSync(enumsPath, content, "utf-8")
}

// Admin API Routes

// Schema API
router.get("/api/schema", (req, res) => {
    try {
        const schema = getFullSchema()
        const parsedSchema = parseSchema(schema)
        res.json({
            success: true,
            data: {
                raw: schema,
                parsed: parsedSchema,
            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to read schema",
            error: (error as Error).message,
        })
    }
})

// Get model file locations
router.get("/api/schema/models", authenticateAdmin, (req, res) => {
    try {
        const baseDir = getSchemaDir()
        const files = getAllPrismaFiles(baseDir)

        const modelFiles: { [key: string]: string } = {}

        for (const file of files) {
            const content = fs.readFileSync(file, "utf-8")
            const lines = content.split("\n")

            for (const line of lines) {
                const modelMatch = line.match(/^model\s+(\w+)\s*\{/)
                if (modelMatch) {
                    const modelName = modelMatch[1]
                    const workspaceRoot = path.join(__dirname, "../../../../../")
                    const relativePath = path.relative(workspaceRoot, file)
                    modelFiles[modelName] = relativePath
                }
            }
        }

        res.json({
            success: true,
            data: modelFiles,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get model files",
            error: (error as Error).message,
        })
    }
})

// Get available categories (folders) for models
router.get("/api/schema/categories", authenticateAdmin, (req, res) => {
    try {
        const baseDir = getSchemaDir()
        const categories: string[] = []

        if (fs.existsSync(baseDir)) {
            const items = fs.readdirSync(baseDir, { withFileTypes: true })

            for (const item of items) {
                if (item.isDirectory()) {
                    categories.push(item.name)
                }
            }
        }

        res.json({
            success: true,
            data: categories,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get categories",
            error: (error as Error).message,
        })
    }
})

// Get all resources (models) for RBAC management
router.get("/api/rbac/resources", (req, res) => {
    try {
        const schema = getFullSchema()
        const parsed = parseSchema(schema)
        
        // Extract model names and basic info
        const resources = parsed.models.map((model: any) => ({
            name: model.name,
            displayName: model.name.replace(/([A-Z])/g, ' $1').trim(),
            fields: model.fields.map((f: any) => ({
                name: f.name,
                type: f.type,
            })),
        }))

        res.json({
            success: true,
            data: resources,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get resources",
            error: (error as Error).message,
        })
    }
})

// Get all API routes for API token permission management (simplified for UFO Studio)
router.get("/api/rbac/api-routes", (req, res) => {
    try {
        // UFO Studio: minimal route list - schema and data CRUD only
        const enrichedRoutes = [
            {
                name: "schema",
                displayName: "Schema",
                description: "Prisma schema management",
                prefix: "/api/schema",
                category: "schema",
                subRoutes: [
                    { method: "GET", path: "/api/schema" },
                    { method: "GET", path: "/api/schema/raw" },
                    { method: "POST", path: "/api/schema/raw" },
                    { method: "POST", path: "/api/schema/generate" },
                    { method: "POST", path: "/api/schema/migrate" },
                ],
            },
            {
                name: "api",
                displayName: "Generic CRUD (Prisma Models)",
                description: "Smart routes for all Prisma model CRUD operations",
                prefix: "/api/v1",
                category: "data",
                subRoutes: [
                    { method: "GET", path: "/api/v1/:modelName" },
                    { method: "GET", path: "/api/v1/:modelName/:id" },
                    { method: "POST", path: "/api/v1/:modelName" },
                    { method: "PUT", path: "/api/v1/:modelName/:id" },
                    { method: "DELETE", path: "/api/v1/:modelName/:id" },
                ],
            },
        ]
        res.json({ success: true, data: enrichedRoutes })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get API routes",
            error: (error as Error).message,
        })
    }
})

// Get menu structure for RBAC management
router.get("/api/rbac/menu-structure", (req, res) => {
    try {
        // Define the menu structure from your actual Menu.tsx
        const menuStructure = [
            {
                id: 'dashboard',
                name: 'Dashboard',
                path: '/',
                icon: 'Dashboard',
            },
            {
                id: 'organization',
                name: 'Organization',
                icon: 'Business',
                children: [
                    {
                        id: 'organizations',
                        name: 'Organizations',
                        path: '/organization',
                        icon: 'Business',
                    },
                    {
                        id: 'map',
                        name: 'Map',
                        path: '/map',
                        icon: 'Map',
                    },
                ],
            },
            {
                id: 'service-contracts',
                name: 'Service Contracts',
                path: '/organization-service-contract',
                icon: 'ReceiptLong',
            },
            {
                id: 'domains',
                name: 'Domains',
                path: '/domain',
                icon: 'Language',
            },
            {
                id: 'pub-sub',
                name: 'Subscriber Management',
                path: '/pub-sub-subscriber',
                icon: 'Event',
            },
            {
                id: 'asset-manager',
                name: 'Asset Manager',
                icon: 'Assignment',
                children: [
                    {
                        id: 'asset-dashboard',
                        name: 'Asset Dashboard',
                        path: '/asset-manager',
                        icon: 'Dashboard',
                    },
                    {
                        id: 'api-keys',
                        name: 'API Keys',
                        path: '/api-key',
                        icon: 'VpnKey',
                    },
                    {
                        id: 'software-licenses',
                        name: 'Software Licenses',
                        path: '/software-license',
                        icon: 'Article',
                    },
                    {
                        id: 'servers',
                        name: 'Servers',
                        path: '/server',
                        icon: 'Storage',
                    },
                    {
                        id: 'assets',
                        name: 'Assets Manager',
                        path: '/asset',
                        icon: 'ContentPaste',
                    },
                    {
                        id: 'apps',
                        name: 'Apps',
                        path: '/app',
                        icon: 'Apps',
                    },
                ],
            },
            {
                id: 'configure-synapse',
                name: 'Configure Synapse',
                icon: 'Settings',
                children: [
                    {
                        id: 'core-services',
                        name: 'Core Services',
                        path: '/core-services',
                        icon: 'DesignServices',
                    },
                    {
                        id: 'service-context',
                        name: 'Service Context',
                        path: '/service-context',
                        icon: 'DesignServices',
                    },
                    {
                        id: 'platforms',
                        name: 'Platforms',
                        path: '/platforms',
                        icon: 'Layers',
                    },
                    {
                        id: 'lists',
                        name: 'Manage Lists',
                        path: '/list',
                        icon: 'FormatListBulleted',
                    },
                    {
                        id: 'customize-plan-deck',
                        name: 'Deck Management',
                        path: '/customize-plan-deck',
                        icon: 'Article',
                    },
                    {
                        id: 'onboarding-display-condition',
                        name: 'Display Conditions',
                        path: '/onboarding-display-condition',
                        icon: 'Settings',
                    },
                    {
                        id: 'website-template',
                        name: 'Website Templates',
                        path: '/website-template',
                        icon: 'Language',
                    },
                    {
                        id: 'rbac',
                        name: 'RBAC',
                        path: '/rbac',
                        icon: 'ManageAccounts',
                    },
                ],
            },
            {
                id: 'support',
                name: 'Support',
                icon: 'ChangeCircle',
                children: [
                    {
                        id: 'dns-change',
                        name: 'DNS Change',
                        path: '/support/dns-change',
                        icon: 'Dns',
                    },
                    {
                        id: 'design-change',
                        name: 'Design Change',
                        path: '/support/design-change',
                        icon: 'Brush',
                    },
                    {
                        id: 'seo-change',
                        name: 'SEO Change',
                        path: '/support/seo-change',
                        icon: 'Search',
                    },
                    {
                        id: 'ppc-change',
                        name: 'PPC Change',
                        path: '/support/ppc-change',
                        icon: 'Campaign',
                    },
                    {
                        id: 'social-change',
                        name: 'Social Change',
                        path: '/support/social-change',
                        icon: 'Share',
                    },
                    {
                        id: 'content-change',
                        name: 'Content Change',
                        path: '/support/content-change',
                        icon: 'ContentPaste',
                    },
                    {
                        id: 'brand-change',
                        name: 'Brand Change',
                        path: '/support/brand-change',
                        icon: 'BrandingWatermark',
                    },
                    {
                        id: 'analytics-change',
                        name: 'Analytics Change',
                        path: '/support/analytics-change',
                        icon: 'Analytics',
                    },
                ],
            },
        ]

        res.json({
            success: true,
            data: menuStructure,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get menu structure",
            error: (error as Error).message,
        })
    }
})

// Raw schema endpoints
router.get("/api/schema/raw", authenticateAdmin, (req, res) => {
    try {
        const content = getFullSchema()
        res.json({
            success: true,
            content: content,
        })
    } catch (error) {
        console.error("Get raw schema error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to load schema",
            error: (error as Error).message,
        })
    }
})

router.post("/api/schema/raw", authenticateAdmin, (req, res) => {
    try {
        const { content } = req.body

        if (!content || typeof content !== "string") {
            return res.status(400).json({
                success: false,
                message: "Schema content is required",
            })
        }

        // For split schema, we'll save to a temporary file and then parse it
        // This is a simplified approach - in production you might want more sophisticated parsing
        const tempSchemaPath = getSchemaFilePath()
        writeFileSync(tempSchemaPath, content, "utf-8")

        res.json({
            success: true,
            message: "Schema saved successfully (temporary file)",
        })
    } catch (error) {
        console.error("Save raw schema error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to save schema",
            error: (error as Error).message,
        })
    }
})

// Generate Prisma client
router.post("/api/schema/generate", authenticateAdmin, async (req, res) => {
    try {
        const execAsync = promisify(exec)

        // Run prisma generate
        const schemaPath = getSchemaDir()
        const { stdout, stderr } = await execAsync(`npx prisma generate --schema="${schemaPath}"`, {
            cwd: process.cwd(),
        })

        res.json({
            success: true,
            message: "Prisma client generated successfully",
            output: stdout,
            error: stderr,
        })
    } catch (error) {
        console.error("Generate error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to generate Prisma client",
            error: (error as Error).message,
        })
    }
})

// List migrations
router.get("/api/schema/migrations", authenticateAdmin, (req, res) => {
    try {
        const migrationsDir = path.join(getSchemaDir(), "migrations")
        if (!existsSync(migrationsDir)) {
            return res.json({ success: true, migrations: [] })
        }
        const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
        const migrations = entries
            .filter((e) => e.isDirectory() && /^\d+_.+$/.test(e.name))
            .map((dir) => {
                const migrationName = dir.name
                const parts = migrationName.split("_")
                const timestamp = parts[0]
                const name = parts.slice(1).join("_") || "unnamed"
                let sql = ""
                const sqlPath = path.join(migrationsDir, dir.name, "migration.sql")
                if (existsSync(sqlPath)) {
                    sql = readFileSync(sqlPath, "utf-8")
                }
                return { name: migrationName, timestamp, label: name, sql }
            })
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
            .reverse()
        res.json({ success: true, migrations })
    } catch (error) {
        console.error("List migrations error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to list migrations",
            error: (error as Error).message,
        })
    }
})

// Run database migration
router.post("/api/schema/migrate", authenticateAdmin, async (req, res) => {
    try {
        const { name } = req.body

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Migration name is required",
            })
        }

        const execAsync = promisify(exec)

        // Run prisma migrate dev
        const schemaPath = getSchemaDir()
        const { stdout, stderr } = await execAsync(
            `npx prisma migrate dev --name "${name}" --schema="${schemaPath}"`,
            {
                cwd: process.cwd(),
            }
        )

        res.json({
            success: true,
            message: "Migration completed successfully",
            output: stdout,
            error: stderr,
        })
    } catch (error) {
        console.error("Migration error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to run migration",
            error: (error as Error).message,
        })
    }
})

// Field management endpoints - updated for split schema
router.post("/api/schema/field", authenticateAdmin, (req, res) => {
    try {
        const { modelName, field } = req.body

        if (!modelName || !field) {
            return res.status(400).json({
                success: false,
                message: "Model name and field data are required",
            })
        }

        const filePath = findModelFile(modelName)
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`,
            })
        }

        const schema = readFileSync(filePath, "utf-8")

        // Check if this is a relation field
        const isRelationField =
            field.relationMetadata && field.relationMetadata.targetModel
        const fieldDefinitions: string[] = []

        if (isRelationField) {
            const targetModel = field.relationMetadata.targetModel
            const isArray = field.relationMetadata.isArray
            const relationType =
                field.relationMetadata.relationType || "implicit"
            const relationName = field.relationMetadata.relationName

            // Use foreign key field name from metadata or generate one
            const foreignKeyName =
                field.relationMetadata.foreignKeyName || `${field.name}Id`
            const isOptional = field.type.includes("?")
            const isOneToOne = field.relationMetadata.isOneToOne || false

            // Add foreign key field with @unique for one-to-one relations
            const foreignKeyDefinition = `  ${foreignKeyName} Int${
                isOptional ? "?" : ""
            }${isOneToOne ? " @unique" : ""}`
            fieldDefinitions.push(foreignKeyDefinition)

            // Add relation field with proper @relation attribute
            const relationAttribute = `@relation(fields: [${foreignKeyName}], references: [id]${
                relationName ? `, name: "${relationName}"` : ""
            })`
            fieldDefinitions.push(
                `  ${field.name} ${targetModel}${
                    isOptional ? "?" : ""
                } ${relationAttribute}`
            )

            // Handle bidirectional relationship in target model
            if (relationType === "implicit") {
                const reverseFieldName =
                    modelName.charAt(0).toLowerCase() +
                    modelName.slice(1) +
                    (isArray ? "s" : "")

                // Find target model file and add reverse relationship
                const targetModelFile = findModelFile(targetModel)
                if (targetModelFile) {
                    const targetSchema = readFileSync(targetModelFile, "utf-8")
                    const lines = targetSchema.split("\n")
                      const result: string[] = []
                      let inTargetModel = false
                      let bracesCount = 0
                    const targetModelFields: string[] = []

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i]

                        if (
                            line.match(
                                new RegExp(
                                    `^\\s*model\\s+${targetModel}\\s*\\{`
                                )
                            )
                        ) {
                            inTargetModel = true
                            bracesCount = 1
                            result.push(line)
                            continue
                        }

                        if (inTargetModel) {
                            if (line.includes("{")) bracesCount++
                            if (line.includes("}")) bracesCount--

                            if (bracesCount === 0) {
                                const hasReverseField = targetModelFields.some(
                                    (l) => l.includes(reverseFieldName)
                                )

                                if (!hasReverseField) {
                                    if (isArray) {
                                        result.push(
                                            `  ${reverseFieldName} ${modelName}[]${
                                                relationName
                                                    ? ` @relation(name: "${relationName}")`
                                                    : ""
                                            }`
                                        )
                                    } else {
                                        result.push(
                                            `  ${reverseFieldName} ${modelName}?${
                                                relationName
                                                    ? ` @relation(name: "${relationName}")`
                                                    : ""
                                            }`
                                        )
                                    }
                                }

                                inTargetModel = false
                                result.push(line)
                                continue
                            } else {
                                targetModelFields.push(line)
                            }
                        }

                        result.push(line)
                    }

                    writeFileSync(targetModelFile, result.join("\n"), "utf-8")
                }
            }
        } else {
            // Regular field
            fieldDefinitions.push(`  ${field.name} ${field.type}`)
        }

        // Find the model and add the fields
        const lines = schema.split("\n")
        const result: string[] = []
        let inTargetModel = false
        let bracesCount = 0

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (line.match(new RegExp(`^\\s*model\\s+${modelName}\\s*\\{`))) {
                inTargetModel = true
                bracesCount = 1
                result.push(line)
                continue
            }

            if (inTargetModel) {
                if (line.includes("{")) bracesCount++
                if (line.includes("}")) bracesCount--

                if (bracesCount === 0) {
                    // Add new fields before closing brace
                    fieldDefinitions.forEach((fieldDef) => {
                        result.push(fieldDef)
                    })
                    inTargetModel = false
                    result.push(line)
                    continue
                }
            }

            result.push(line)
        }

        writeFileSync(filePath, result.join("\n"), "utf-8")

        res.json({
            success: true,
            message: isRelationField
                ? "Relation field added with foreign key and bidirectional relationship"
                : "Field added successfully",
            relationType: isRelationField
                ? field.relationMetadata.relationType || "implicit"
                : null,
        })
    } catch (error) {
        console.error("Add field error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to add field",
            error: (error as Error).message,
        })
    }
})

router.put("/api/schema/field", authenticateAdmin, (req, res) => {
    try {
        const { modelName, oldFieldName, newField } = req.body

        if (!modelName || !oldFieldName || !newField) {
            return res.status(400).json({
                success: false,
                message:
                    "Model name, old field name, and new field data are required",
            })
        }

        const filePath = findModelFile(modelName)
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`,
            })
        }

        let schema = readFileSync(filePath, "utf-8")

        // Find and replace the field in the model
        const modelRegex = new RegExp(
            `(model\\s+${modelName}\\s*\\{[^}]*?)(\\s+${oldFieldName}\\s+[^\\n]*\\n)([^}]*\\})`,
            "g"
        )
        schema = schema.replace(
            modelRegex,
            (match, modelStart, oldFieldLine, modelEnd) => {
                return `${modelStart}  ${newField.name} ${newField.type}\n${modelEnd}`
            }
        )

        writeFileSync(filePath, schema, "utf-8")

        res.json({
            success: true,
            message: "Field updated successfully",
        })
    } catch (error) {
        console.error("Update field error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to update field",
            error: (error as Error).message,
        })
    }
})

router.delete("/api/schema/field", authenticateAdmin, (req, res) => {
    try {
        const { modelName, fieldName } = req.body

        if (!modelName || !fieldName) {
            return res.status(400).json({
                success: false,
                message: "Model name and field name are required",
            })
        }

        const filePath = findModelFile(modelName)
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`,
            })
        }

        const schema = readFileSync(filePath, "utf-8")

        // Split schema into lines for precise editing
        const lines = schema.split("\n")
        const fieldsToDelete = new Set<string>([fieldName])

        // First pass: if deleting a relation field, also mark its FK for deletion (e.g. TESTId when deleting TEST)
        let inTargetModel = false
        let bracesCount = 0
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.match(new RegExp(`^\\s*model\\s+${modelName}\\s*\\{`))) {
                inTargetModel = true
                bracesCount = 1
            } else if (inTargetModel) {
                if (line.includes("{")) bracesCount++
                if (line.includes("}")) bracesCount--
                if (bracesCount === 0) inTargetModel = false
                if (inTargetModel) {
                    const fieldRegex = new RegExp(`^\\s*${fieldName}\\s+.*$`)
                    if (fieldRegex.test(line) && line.includes("@relation")) {
                        fieldsToDelete.add(`${fieldName}Id`)
                        break
                    }
                }
            }
        }

        // Second pass: filter out all fields to delete
        const result: string[] = []
        inTargetModel = false
        bracesCount = 0
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (line.match(new RegExp(`^\\s*model\\s+${modelName}\\s*\\{`))) {
                inTargetModel = true
                bracesCount = 1
                result.push(line)
                continue
            }

            if (inTargetModel) {
                if (line.includes("{")) bracesCount++
                if (line.includes("}")) bracesCount--
                if (bracesCount === 0) {
                    inTargetModel = false
                    result.push(line)
                    continue
                }
            }

            if (inTargetModel) {
                let shouldSkip = false
                for (const f of fieldsToDelete) {
                    const fieldRegex = new RegExp(`^\\s*${f}\\s+.*$`)
                    if (fieldRegex.test(line)) {
                        shouldSkip = true
                        break
                    }
                }
                if (shouldSkip) continue
            }

            result.push(line)
        }

        writeFileSync(filePath, result.join("\n"), "utf-8")

        res.json({
            success: true,
            message: "Field deleted successfully",
        })
    } catch (error) {
        console.error("Delete field error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to delete field",
            error: (error as Error).message,
        })
    }
})

// Model management endpoints - updated for split schema
router.post("/api/schema/model", authenticateAdmin, (req, res) => {
    try {
        const { name, fields, category = "models" } = req.body

        if (!name || !fields || !Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Model name and fields array are required",
            })
        }

        // Check if model already exists
        const existingFile = findModelFile(name)
        if (existingFile) {
            return res.status(400).json({
                success: false,
                message: `Model ${name} already exists`,
            })
        }

        // Create the model file
        const filePath = createModelFile(name, fields, category)

        res.json({
            success: true,
            message: "Model created successfully",
            filePath: filePath,
        })
    } catch (error) {
        console.error("Create model error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to create model",
            error: (error as Error).message,
        })
    }
})

router.put("/api/schema/model/:modelName", authenticateAdmin, (req, res) => {
    try {
        const { modelName } = req.params
        const { fields } = req.body

        if (!fields || !Array.isArray(fields)) {
            return res.status(400).json({
                success: false,
                message: "Fields array is required",
            })
        }

        // Check if model exists
        const filePath = findModelFile(modelName)
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`,
            })
        }

        // Update the model file
        updateModelFile(modelName, fields)

        res.json({
            success: true,
            message: "Model updated successfully",
        })
    } catch (error) {
        console.error("Update model error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to update model",
            error: (error as Error).message,
        })
    }
})

router.delete("/api/schema/model/:modelName", authenticateAdmin, (req, res) => {
    try {
        const { modelName } = req.params

        if (!modelName) {
            return res.status(400).json({
                success: false,
                message: "Model name is required",
            })
        }

        // Check if model exists
        const filePath = findModelFile(modelName)
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`,
            })
        }

        // Delete the model file
        deleteModelFile(modelName)

        res.json({
            success: true,
            message: "Model deleted successfully",
        })
    } catch (error) {
        console.error("Delete model error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to delete model",
            error: (error as Error).message,
        })
    }
})

// Move model to different category
router.put(
    "/api/schema/model/:modelName/move",
    authenticateAdmin,
    (req, res) => {
        try {
            const { modelName } = req.params
            const { category } = req.body

            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "Category is required",
                })
            }

            // Find the current model file
            const currentFilePath = findModelFile(modelName)
            if (!currentFilePath) {
                return res.status(404).json({
                    success: false,
                    message: `Model ${modelName} not found`,
                })
            }

            // Read the current model content
            const modelContent = fs.readFileSync(currentFilePath, "utf-8")

            // Create the new file path
            const baseDir = path.join(
                process.cwd(),
                "prisma",
                "schema",
                category
            )
            if (!existsSync(baseDir)) {
                mkdirSync(baseDir, { recursive: true })
            }

            const newFilePath = path.join(baseDir, `${modelName}.prisma`)

            // Write to new location
            writeFileSync(newFilePath, modelContent, "utf-8")

            // Delete the old file
            fs.unlinkSync(currentFilePath)

            res.json({
                success: true,
                message: `Model ${modelName} moved to category ${category}`,
                newPath: path.relative(process.cwd(), newFilePath),
            })
        } catch (error) {
            console.error("Move model error:", error)
            res.status(500).json({
                success: false,
                message: "Failed to move model",
                error: (error as Error).message,
            })
        }
    }
)

// Enum management endpoints - updated for split schema
router.post("/api/schema/enum", authenticateAdmin, (req, res) => {
    try {
        const { enumName, values } = req.body

        if (
            !enumName ||
            !values ||
            !Array.isArray(values) ||
            values.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Enum name and values array are required",
            })
        }

        // Add enum to enums.prisma file
        addEnumToFile(enumName, values)

        res.json({
            success: true,
            message: "Enum created successfully",
        })
    } catch (error) {
        console.error("Add enum error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to add enum",
            error: (error as Error).message,
        })
    }
})

router.put("/api/schema/enum/:enumName", authenticateAdmin, (req, res) => {
    try {
        const { enumName } = req.params
        const { values } = req.body

        if (
            !enumName ||
            !values ||
            !Array.isArray(values) ||
            values.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Enum name and values array are required",
            })
        }

        // Update enum in enums.prisma file
        updateEnumInFile(enumName, values)

        res.json({
            success: true,
            message: "Enum updated successfully",
        })
    } catch (error) {
        console.error("Update enum error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to update enum",
            error: (error as Error).message,
        })
    }
})

router.delete("/api/schema/enum/:enumName", authenticateAdmin, (req, res) => {
    try {
        const { enumName } = req.params

        if (!enumName) {
            return res.status(400).json({
                success: false,
                message: "Enum name is required",
            })
        }

        // Delete enum from enums.prisma file
        deleteEnumFromFile(enumName)

        res.json({
            success: true,
            message: "Enum deleted successfully",
        })
    } catch (error) {
        console.error("Delete enum error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to delete enum",
            error: (error as Error).message,
        })
    }
})

// Helper function to parse schema
function parseSchema(schema: string) {
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
        } else if (
            inModel &&
            currentModel &&
            trimmed &&
            !trimmed.startsWith("//")
        ) {
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
        } else if (
            inEnum &&
            currentEnum &&
            trimmed &&
            !trimmed.startsWith("//")
        ) {
            currentEnum.values.push(trimmed)
        }
    }

    return { models, enums }
}

// Settings API endpoints
router.get("/api/settings", authenticateAdmin, (req, res) => {
    try {
        // Read current settings from a configuration file or database
        const settingsPath = path.join(process.cwd(), "admin-settings.json")

        let settings = {
            theme: "light",
            itemsPerPage: 25,
            autoRefresh: false,
            refreshInterval: 30,
            showRelationships: true,
            compactMode: false,
            notifications: true,
        }

        if (fs.existsSync(settingsPath)) {
            const fileContent = fs.readFileSync(settingsPath, "utf-8")
            settings = { ...settings, ...JSON.parse(fileContent) }
        }

        res.json({
            success: true,
            data: settings,
        })
    } catch (error) {
        console.error("Settings fetch error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to fetch settings",
        })
    }
})

router.post("/api/settings", authenticateAdmin, (req, res) => {
    try {
        const { settings } = req.body

        if (!settings || typeof settings !== "object") {
            return res.status(400).json({
                success: false,
                message: "Settings object is required",
            })
        }

        // Save settings to file
        const settingsPath = path.join(process.cwd(), "admin-settings.json")
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))

        res.json({
            success: true,
            message: "Settings saved successfully",
            data: settings,
        })
    } catch (error) {
        console.error("Settings save error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to save settings",
        })
    }
})

// JSON replacer to serialize BigInt, Prisma Decimal, Date (PostgreSQL raw query returns these)
function queryResultReplacer(_key: string, value: unknown): unknown {
    if (typeof value === "bigint") return value.toString()
    if (value instanceof Date) return value.toISOString()
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        const o = value as Record<string, unknown>
        // Prisma.Decimal - has toFixed, toJSON, toString, toNumber
        if (typeof o.toFixed === "function") return (o as { toFixed: () => string }).toFixed()
        if (typeof o.toJSON === "function") return (o as { toJSON: () => unknown }).toJSON()
        if (typeof o.toNumber === "function") {
            const n = (o as { toNumber: () => number }).toNumber()
            if (Number.isFinite(n)) return n
        }
        if (typeof o.valueOf === "function") {
            const v = (o as { valueOf: () => unknown }).valueOf()
            if (typeof v === "number" && Number.isFinite(v)) return v
            if (typeof v === "string") return v
        }
        if (typeof o.toString === "function") {
            const str = (o as { toString: () => string }).toString()
            if (str !== "[object Object]") return str
        }
    }
    return value
}

// Raw SQL query endpoint
router.post("/api/query", authenticateAdmin, async (req, res) => {
    try {
        const { sql } = req.body
        if (!sql || typeof sql !== "string") {
            return res.status(400).json({
                success: false,
                message: "SQL query string is required",
            })
        }
        const trimmed = sql.trim()
        if (!trimmed) {
            return res.status(400).json({
                success: false,
                message: "SQL query cannot be empty",
            })
        }
        const result = await prisma.$queryRawUnsafe(trimmed)
        const json = JSON.stringify(
            { success: true, data: result, rowCount: Array.isArray(result) ? result.length : 0 },
            queryResultReplacer
        )
        res.setHeader("Content-Type", "application/json")
        res.send(json)
    } catch (error) {
        console.error("SQL query error:", error)
        res.status(500).json({
            success: false,
            message: "Query failed",
            details: error instanceof Error ? error.message : "Unknown error",
        })
    }
})

// SQL scripts directory (project root / sql-scripts)
const SQL_SCRIPTS_DIR = path.join(process.cwd(), "sql-scripts")

function getSqlScriptsDir(): string {
    if (!existsSync(SQL_SCRIPTS_DIR)) {
        mkdirSync(SQL_SCRIPTS_DIR, { recursive: true })
    }
    return SQL_SCRIPTS_DIR
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_.-]/g, "_")
}

// Save SQL script to server
router.post("/api/query/save", authenticateAdmin, (req, res) => {
    try {
        const { name, sql } = req.body
        if (!name || typeof name !== "string") {
            return res.status(400).json({ success: false, message: "Script name is required" })
        }
        if (!sql || typeof sql !== "string") {
            return res.status(400).json({ success: false, message: "SQL content is required" })
        }
        const safeName = sanitizeFilename(name.trim()) || "query"
        const filename = safeName.endsWith(".sql") ? safeName : `${safeName}.sql`
        const dir = getSqlScriptsDir()
        const filePath = path.join(dir, filename)
        writeFileSync(filePath, sql.trim(), "utf-8")
        res.json({ success: true, message: "Script saved", path: filename })
    } catch (error) {
        console.error("SQL script save error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to save script",
            details: error instanceof Error ? error.message : "Unknown error",
        })
    }
})

// List saved SQL scripts on server
router.get("/api/query/scripts", authenticateAdmin, (req, res) => {
    try {
        const dir = getSqlScriptsDir()
        const files = fs.readdirSync(dir)
        const scripts = files
            .filter((f) => f.endsWith(".sql"))
            .map((f) => ({ name: f.replace(/\.sql$/i, ""), filename: f }))
        res.json({ success: true, data: scripts })
    } catch (error) {
        console.error("SQL scripts list error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to list scripts",
        })
    }
})

// Get SQL script content from server
router.get("/api/query/scripts/:filename", authenticateAdmin, (req, res) => {
    try {
        const { filename } = req.params
        const safeName = sanitizeFilename(filename)
        const withExt = safeName.endsWith(".sql") ? safeName : `${safeName}.sql`
        const filePath = path.join(getSqlScriptsDir(), withExt)
        if (!existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "Script not found" })
        }
        const content = readFileSync(filePath, "utf-8")
        res.json({ success: true, data: { name: withExt.replace(/\.sql$/i, ""), sql: content } })
    } catch (error) {
        console.error("SQL script read error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to read script",
        })
    }
})

// API v1 endpoints for data operations
router.get("/api/v1/:modelName", authenticateAdmin, async (req, res) => {
    try {
        const { modelName } = req.params
        const {
            page = 1,
            pageSize = 25,
            sortBy,
            sortOrder,
            populate,
            ...filters
        } = req.query

        // Convert to proper types
        const pageNum = parseInt(page as string)
        const pageSizeNum = parseInt(pageSize as string)
        const skip = (pageNum - 1) * pageSizeNum

        // Check if model exists in schema
        const schemaContent = getFullSchema()
        const schema = parseSchema(schemaContent)
        const model = schema.models.find(
            (m) => m.name.toLowerCase() === modelName.toLowerCase()
        )

        if (!model) {
            return res.status(404).json({
                message: `Model ${modelName} not found`,
            })
        }

        // Build the query options
        const findOptions: any = {
            take: pageSizeNum,
            skip: skip,
        }

        // Add sorting
        if (sortBy) {
            findOptions.orderBy = {
                [sortBy as string]: sortOrder === "desc" ? "desc" : "asc",
            }
        }

        // Add population/include (supports nested relations like "deckSteps.onboardingStep")
        if (populate) {
            const validRelationNames = new Set(
                (model.fields || [])
                    .filter((f) => {
                        const baseType = f.type.split(" ")[0].replace("[]", "").replace("?", "")
                        return (schema.models || []).some((m) => m.name === baseType)
                    })
                    .map((f) => f.name)
            )
            const includeFields = (populate as string).split(",")
            findOptions.include = {}

            includeFields.forEach((field) => {
                const trimmedField = field.trim()
                const topLevel = trimmedField.split(".")[0]
                if (!validRelationNames.has(topLevel)) return

                // Handle nested relations (e.g., "deckSteps.onboardingStep")
                if (trimmedField.includes(".")) {
                    const parts = trimmedField.split('.')
                    let current = findOptions.include
                    
                    parts.forEach((part, index) => {
                        if (index === parts.length - 1) {
                            // Last part - set to true
                            current[part] = true
                        } else {
                            // Intermediate part - create nested object
                            if (!current[part]) {
                                current[part] = { include: {} }
                            } else if (current[part] === true) {
                                current[part] = { include: {} }
                            }
                            current = current[part].include
                        }
                    })
                } else {
                    // Simple relation
                    findOptions.include[trimmedField] = true
                }
            })
        }

        // Add filters
        if (Object.keys(filters).length > 0) {
            findOptions.where = {}

            Object.entries(filters).forEach(([key, value]) => {
                // Handle special filter operators like [contains], [gte], etc.
                if (key.includes("[")) {
                    const [fieldName, operator] = key.split("[")
                    const op = operator.replace("]", "")

                    if (!findOptions.where[fieldName]) {
                        findOptions.where[fieldName] = {}
                    }

                    switch (op) {
                        case "contains":
                            findOptions.where[fieldName].contains = value
                            break
                        case "startsWith":
                            findOptions.where[fieldName].startsWith = value
                            break
                        case "endsWith":
                            findOptions.where[fieldName].endsWith = value
                            break
                        case "gte":
                            findOptions.where[fieldName].gte = Number(value)
                            break
                        case "lte":
                            findOptions.where[fieldName].lte = Number(value)
                            break
                        case "gt":
                            findOptions.where[fieldName].gt = Number(value)
                            break
                        case "lt":
                            findOptions.where[fieldName].lt = Number(value)
                            break
                        case "in":
                            findOptions.where[fieldName].in = (
                                value as string
                            ).split(",")
                            break
                    }
                } else {
                    // Simple equality filter
                    findOptions.where[key] = value
                }
            })
        }

        // Prisma client uses camelCase (e.g. BillingAddress -> billingAddress)
        const prismaModelName = getPrismaModelName(modelName)
        const modelInstance = (prisma as any)[prismaModelName]

        if (!modelInstance) {
            throw new Error(`Model ${modelName} not found in Prisma client`)
        }

        const [records, total] = await Promise.all([
            modelInstance.findMany(findOptions),
            modelInstance.count(filters ? { where: findOptions.where } : {}),
        ])

        // Format response according to documentation
        res.json({
            data: records,
            meta: {
                pagination: {
                    page: pageNum,
                    pageSize: pageSizeNum,
                    pageCount: Math.ceil(total / pageSizeNum),
                    total,
                },
            },
        })
    } catch (error) {
        console.error("Data fetch error:", error)
        res.status(500).json({
            message: `Failed to fetch data: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        })
    }
})

// Get single record
router.get("/api/v1/:modelName/:id", authenticateAdmin, async (req, res) => {
    try {
        const { modelName, id } = req.params
        const { populate } = req.query

        const prismaModelName = getPrismaModelName(modelName)
        const modelInstance = (prisma as any)[prismaModelName]

        if (!modelInstance) {
            return res.status(404).json({
                message: `Model ${modelName} not found`,
            })
        }

        // Build query options
        const findOptions: any = {}

        // Add population/include (supports nested relations like "deckSteps.onboardingStep")
        if (populate) {
            const schemaContent = getFullSchema()
            const schema = parseSchema(schemaContent)
            const model = schema.models.find(
                (m) => m.name.toLowerCase() === modelName.toLowerCase()
            )
            const validRelationNames = model
                ? new Set(
                      (model.fields || [])
                          .filter((f) => {
                              const baseType = f.type.split(" ")[0].replace("[]", "").replace("?", "")
                              return (schema.models || []).some((m) => m.name === baseType)
                          })
                          .map((f) => f.name)
                  )
                : new Set<string>()
            const includeFields = (populate as string).split(",")
            findOptions.include = {}

            includeFields.forEach((field) => {
                const trimmedField = field.trim()
                const topLevel = trimmedField.split(".")[0]
                if (!validRelationNames.has(topLevel)) return

                // Handle nested relations (e.g., "deckSteps.onboardingStep")
                if (trimmedField.includes(".")) {
                    const parts = trimmedField.split('.')
                    let current = findOptions.include
                    
                    parts.forEach((part, index) => {
                        if (index === parts.length - 1) {
                            // Last part - set to true
                            current[part] = true
                        } else {
                            // Intermediate part - create nested object
                            if (!current[part]) {
                                current[part] = { include: {} }
                            } else if (current[part] === true) {
                                current[part] = { include: {} }
                            }
                            current = current[part].include
                        }
                    })
                } else {
                    // Simple relation
                    findOptions.include[trimmedField] = true
                }
            })
        }

        const record = await modelInstance.findUnique({
            where: { id: parseInt(id) },
            ...findOptions,
        })

        if (!record) {
            return res.status(404).json({
                message: "Record not found",
                details: {
                    model: modelName,
                    id: id,
                },
            })
        }

        res.json({
            data: record,
        })
    } catch (error) {
        console.error("Data fetch error:", error)
        res.status(500).json({
            message: `Failed to fetch record: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        })
    }
})

// Create record
router.post("/api/v1/:modelName", authenticateAdmin, async (req, res) => {
    try {
        const { modelName } = req.params
        const data = req.body

        if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
            return res.status(400).json({
                message: "Data is required",
            })
        }

        const prismaModelName = getPrismaModelName(modelName)
        const modelInstance = (prisma as any)[prismaModelName]

        if (!modelInstance) {
            return res.status(404).json({
                message: `Model ${modelName} not found`,
            })
        }

        const record = await modelInstance.create({
            data,
        })

        res.status(201).json({
            data: record,
        })
    } catch (error) {
        return handlePrismaError(error, res, "Failed to create record")
    }
})

// Update record
router.put("/api/v1/:modelName/:id", authenticateAdmin, async (req, res) => {
    try {
        const { modelName, id } = req.params
        const data = req.body

        if (!data) {
            return res.status(400).json({
                message: "Data is required",
            })
        }

        const prismaModelName = getPrismaModelName(modelName)
        const modelInstance = (prisma as any)[prismaModelName]

        if (!modelInstance) {
            return res.status(404).json({
                message: `Model ${modelName} not found`,
            })
        }

        // Special handling for role permissions updates
        if (prismaModelName === 'role' && data.permissions) {
            const roleId = parseInt(id)
            
            // Check if role exists
            const currentRole = await prisma.role.findUnique({
                where: { id: roleId }
            })

            if (!currentRole) {
                return res.status(404).json({
                    message: `Role not found`,
                })
            }

            // Build set of permission IDs that should exist for this role
            const targetPermissionIds = new Set<number>()
            for (const perm of data.permissions) {
                if (perm.permissionId) {
                    targetPermissionIds.add(perm.permissionId)
                }
            }

            // Get current rolePermissions
            const currentRolePerms = await prisma.rolePermission.findMany({
                where: { roleId }
            })

            // Find which ones to delete (exist in DB but not in target set)
            const rolePermsToDelete = currentRolePerms.filter(
                rp => !targetPermissionIds.has(rp.permissionId)
            )

            // Find which permissionIds to add (in target set but not in DB)
            const currentPermissionIds = new Set(currentRolePerms.map(rp => rp.permissionId))
            const permissionIdsToAdd = Array.from(targetPermissionIds).filter(
                permId => !currentPermissionIds.has(permId)
            )

            // Execute deletions
            if (rolePermsToDelete.length > 0) {
                await prisma.rolePermission.deleteMany({
                    where: {
                        id: { in: rolePermsToDelete.map(rp => rp.id) }
                    }
                })
                console.log(`🗑️  Deleted ${rolePermsToDelete.length} rolePermissions`)
            }

            // Execute creations
            if (permissionIdsToAdd.length > 0) {
                await prisma.rolePermission.createMany({
                    data: permissionIdsToAdd.map(permissionId => ({
                        roleId,
                        permissionId
                    })),
                    skipDuplicates: true
                })
                console.log(`✅ Created ${permissionIdsToAdd.length} rolePermissions`)
            }

            // Get updated role
            const record = await prisma.role.findUnique({
                where: { id: roleId },
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            })

            return res.json({
                data: record,
            })
        }

        const record = await modelInstance.update({
            where: { id: parseInt(id) },
            data,
        })

        res.json({
            data: record,
        })
    } catch (error) {
        return handlePrismaError(error, res, "Failed to update record")
    }
})

// Delete record
router.delete("/api/v1/:modelName/:id", authenticateAdmin, async (req, res) => {
    try {
        const { modelName, id } = req.params

        const prismaModelName = getPrismaModelName(modelName)
        const modelInstance = (prisma as any)[prismaModelName]

        if (!modelInstance) {
            return res.status(404).json({
                message: `Model ${modelName} not found`,
            })
        }

        await modelInstance.delete({
            where: { id: parseInt(id) },
        })

        res.json({
            data: null,
            meta: {
                message: "Record deleted successfully",
            },
        })
    } catch (error) {
        console.error("Data delete error:", error)
        res.status(500).json({
            message: `Failed to delete record: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        })
    }
})

// Serve static assets (for new React app: /assets/*) - must be before catch-all
router.use(express.static(getStudioPublicDir(), { index: false }))

// Main interface: serve index.html
router.get("/", authenticateAdmin, (req, res) => {
    try {
        res.sendFile(path.join(getStudioPublicDir(), "index.html"))
    } catch (error) {
        console.error("Error serving studio:", error)
        res.status(500).send("Error loading studio")
    }
})

// Catch-all route for SPA client-side routing
// This MUST be the last route to avoid conflicts with other routes
router.get("*", authenticateAdmin, (req, res) => {
    if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "API endpoint not found" })
    }
    try {
        res.sendFile(path.join(getStudioPublicDir(), "index.html"))
    } catch (error) {
        console.error("Error serving studio:", error)
        res.status(500).send("Error loading studio")
    }
})

export default router
