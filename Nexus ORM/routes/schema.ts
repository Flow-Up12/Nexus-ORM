import { Router } from 'express'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { prisma } from '../../lib/prisma'

const router = Router()
const execAsync = promisify(exec)

interface ParsedField {
    name: string;
    type: string;
    raw: string;
}

interface ParsedModel {
    name: string;
    fields: ParsedField[];
    attributes: string[];
}

interface ParsedEnum {
    name: string;
    values: string[];
}

// Get current schema
router.get('/schema', async (req, res) => {
    try {
        const schemaPath = join(process.cwd(), 'prisma', 'schema', 'schema.prisma')
        const schema = readFileSync(schemaPath, 'utf-8')
        const parsedSchema = parseSchema(schema)
        
        res.json({
            success: true,
            data: {
                raw: schema,
                parsed: parsedSchema
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to read schema',
            error: (error as Error).message
        })
    }
})

// Update schema
router.put('/schema', async (req, res) => {
    try {
        const { schema } = req.body
        const schemaPath = join(process.cwd(), 'prisma', 'schema', 'schema.prisma')
        
        // Validate schema syntax first
        const validation = await validateSchema(schema)
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Schema validation failed',
                errors: validation.errors
            })
        }
        
        // Write schema
        writeFileSync(schemaPath, schema, 'utf-8')
        
        res.json({
            success: true,
            message: 'Schema updated successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update schema',
            error: (error as Error).message
        })
    }
})

// Add new model
router.post('/models', async (req, res) => {
    try {
        const { name, fields } = req.body
        const schemaPath = join(process.cwd(), 'prisma', 'schema', 'schema.prisma')
        const currentSchema = readFileSync(schemaPath, 'utf-8')
        
        const newModel = generateModelString(name, fields)
        const updatedSchema = currentSchema + '\n\n' + newModel
        
        writeFileSync(schemaPath, updatedSchema, 'utf-8')
        
        res.json({
            success: true,
            message: `Model ${name} created successfully`
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create model',
            error: (error as Error).message
        })
    }
})

// Update model
router.put('/models/:modelName', async (req, res) => {
    try {
        const { modelName } = req.params
        const { fields, attributes } = req.body
        
        const schemaPath = join(process.cwd(), 'prisma', 'schema', 'schema.prisma')
        const currentSchema = readFileSync(schemaPath, 'utf-8')
        
        const updatedSchema = updateModelInSchema(currentSchema, modelName, fields, attributes)
        writeFileSync(schemaPath, updatedSchema, 'utf-8')
        
        res.json({
            success: true,
            message: `Model ${modelName} updated successfully`
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update model',
            error: (error as Error).message
        })
    }
})

// Update individual model fields with bidirectional relations
router.put('/models/:modelName/fields', async (req, res) => {
    try {
        const { modelName } = req.params
        const { fields } = req.body
        
        const schemaPath = join(process.cwd(), 'prisma', 'schema', 'schema.prisma')
        const currentSchema = readFileSync(schemaPath, 'utf-8')
        const parsedSchema = parseSchema(currentSchema)
        
        // Handle bidirectional relations
        const updatedSchema = handleBidirectionalRelations(currentSchema, modelName, fields, parsedSchema)
        writeFileSync(schemaPath, updatedSchema, 'utf-8')
        
        res.json({
            success: true,
            message: `Model ${modelName} updated successfully with bidirectional relations`
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update model fields',
            error: (error as Error).message
        })
    }
})

// Helper function to handle bidirectional relations
function handleBidirectionalRelations(schema: string, modelName: string, fields: any[], parsedSchema: any) {
    let updatedSchema = schema
    
    // First, update the main model
    updatedSchema = updateModelInSchemaWithFields(updatedSchema, modelName, fields, parsedSchema)
    
    // Then, handle bidirectional relations
    fields.forEach((field: any) => {
        if (field.type.includes('@relation')) {
            const relatedModelName = field.type.split(' ')[0].replace('[]', '')
            
            // Check if related model exists
            const relatedModel = parsedSchema.models.find((m: any) => m.name === relatedModelName)
            if (relatedModel) {
                // Check if opposite relation already exists
                const oppositeField = relatedModel.fields.find((f: any) => 
                    f.type.includes(modelName) && f.type.includes('@relation')
                )
                
                if (!oppositeField) {
                    // Add opposite relation
                    const isArray = field.type.includes('[]')
                    const oppositeFieldName = isArray ? 
                        `${modelName.toLowerCase()}s` : // One-to-many: user -> posts[]
                        modelName.toLowerCase()         // One-to-one: user -> profile
                    
                    const oppositeFieldType = isArray ?
                        `${modelName}[] @relation` :
                        `${modelName}? @relation`
                    
                    // Add the opposite field to the related model
                    const relatedModelFields = [...relatedModel.fields, {
                        name: oppositeFieldName,
                        type: oppositeFieldType
                    }]
                    
                    updatedSchema = updateModelInSchemaWithFields(updatedSchema, relatedModelName, relatedModelFields, parsedSchema)
                }
            }
        }
    })
    
    return updatedSchema
}

function updateModelInSchemaWithFields(schema: string, modelName: string, fields: any[], parsedSchema: any) {
    const lines = schema.split('\n')
    const result = []
    let inTargetModel = false
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()
        
        if (trimmed.startsWith(`model ${modelName}`)) {
            inTargetModel = true
            result.push(line)
        } else if (inTargetModel && trimmed === '}') {
            // Add updated fields
            fields.forEach((field: any) => {
                result.push(`  ${field.name} ${field.type}`)
            })
            
            // Add any existing attributes (@@unique, @@index, etc.)
            const existingModel = parsedSchema.models.find((m: any) => m.name === modelName)
            if (existingModel) {
                existingModel.attributes.forEach((attr: string) => {
                    result.push(`  ${attr}`)
                })
            }
            
            result.push(line) // closing brace
            inTargetModel = false
        } else if (!inTargetModel) {
            result.push(line)
        }
        // Skip lines inside the target model (they're being replaced)
    }
    
    return result.join('\n')
}

// Add enum
router.post('/enums', async (req, res) => {
    try {
        const { name, values } = req.body
        const schemaPath = join(process.cwd(), 'prisma', 'schema', 'schema.prisma')
        const currentSchema = readFileSync(schemaPath, 'utf-8')
        
        const enumString = `enum ${name} {\n${values.map((v: string) => `  ${v}`).join('\n')}\n}`
        const updatedSchema = currentSchema + '\n\n' + enumString
        
        writeFileSync(schemaPath, updatedSchema, 'utf-8')
        
        res.json({
            success: true,
            message: `Enum ${name} created successfully`
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create enum',
            error: (error as Error).message
        })
    }
})

// Update enum
router.put('/enums/:enumName', async (req, res) => {
    try {
        const { enumName } = req.params
        const { name, values } = req.body
        const schemaPath = join(process.cwd(), 'prisma', 'schema', 'schema.prisma')
        const currentSchema = readFileSync(schemaPath, 'utf-8')
        
        // Replace the existing enum
        const updatedSchema = updateEnumInSchema(currentSchema, enumName, name, values)
        writeFileSync(schemaPath, updatedSchema, 'utf-8')
        
        res.json({
            success: true,
            message: `Enum ${name} updated successfully`
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update enum',
            error: (error as Error).message
        })
    }
})

// Run migration
router.post('/migrate', async (req, res) => {
    try {
        const { name } = req.body
        const migrationName = name || `migration_${Date.now()}`
        
        // Use the docker command from package.json
        const { stdout, stderr } = await execAsync(`npm run docker:migrate -- --name ${migrationName}`)
        
        res.json({
            success: true,
            message: 'Migration completed successfully',
            output: stdout,
            error: stderr
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: (error as Error).message
        })
    }
})

// Generate Prisma client
router.post('/generate', async (req, res) => {
    try {
        // Use the docker command from package.json
        const { stdout, stderr } = await execAsync('npm run docker:generate')
        
        res.json({
            success: true,
            message: 'Prisma client generated successfully',
            output: stdout,
            error: stderr
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate Prisma client',
            error: (error as Error).message
        })
    }
})

// Format schema
router.post('/format', async (req, res) => {
    try {
        const { stdout, stderr } = await execAsync('npx prisma format')
        
        res.json({
            success: true,
            message: 'Schema formatted successfully',
            output: stdout,
            error: stderr
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Formatting failed',
            error: (error as Error).message
        })
    }
})

// Data browsing endpoints
router.get('/data/:modelName', async (req, res) => {
    try {
        const { modelName } = req.params
        const { limit = 10, offset = 0, search, sortBy, sortOrder = 'asc' } = req.query
        
        const modelNameLowercase = modelName.toLowerCase()
        
        // Check if model exists in Prisma client
        if (!(modelNameLowercase in prisma)) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`
            })
        }
        
        const model = (prisma as any)[modelNameLowercase]
        
        // Build query options
        const queryOptions: any = {
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        }
        
        // Add search if provided
        if (search) {
            // Get model fields to search across text fields
            const schemaPath = join(process.cwd(), 'prisma', 'schema', 'schema.prisma')
            const schema = readFileSync(schemaPath, 'utf-8')
            const parsedSchema = parseSchema(schema)
            const modelSchema = parsedSchema.models.find((m: any) => m.name.toLowerCase() === modelNameLowercase)
            
            if (modelSchema) {
                const textFields = modelSchema.fields.filter((f: any) => 
                    f.type.includes('String') && !f.type.includes('@relation')
                )
                
                if (textFields.length > 0) {
                    queryOptions.where = {
                        OR: textFields.map((field: any) => ({
                            [field.name]: {
                                contains: search as string,
                                mode: 'insensitive'
                            }
                        }))
                    }
                }
            }
        }
        
        // Add sorting if provided
        if (sortBy) {
            queryOptions.orderBy = {
                [sortBy as string]: sortOrder
            }
        }
        
        const records = await model.findMany(queryOptions)
        const total = await model.count(search ? { where: queryOptions.where } : {})
        
        res.json({
            success: true,
            data: {
                records,
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch data',
            error: (error as Error).message
        })
    }
})

// Create new record
router.post('/data/:modelName', async (req, res) => {
    try {
        const { modelName } = req.params
        const { data } = req.body
        
        const modelNameLowercase = modelName.toLowerCase()
        
        if (!(modelNameLowercase in prisma)) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`
            })
        }
        
        const model = (prisma as any)[modelNameLowercase]
        const record = await model.create({ data })
        
        res.json({
            success: true,
            message: `${modelName} created successfully`,
            data: record
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create record',
            error: (error as Error).message
        })
    }
})

// Update record
router.put('/data/:modelName/:id', async (req, res) => {
    try {
        const { modelName, id } = req.params
        const { data } = req.body
        
        const modelNameLowercase = modelName.toLowerCase()
        
        if (!(modelNameLowercase in prisma)) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`
            })
        }
        
        const model = (prisma as any)[modelNameLowercase]
        const record = await model.update({
            where: { id: parseInt(id) },
            data
        })
        
        res.json({
            success: true,
            message: `${modelName} updated successfully`,
            data: record
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update record',
            error: (error as Error).message
        })
    }
})

// Delete record
router.delete('/data/:modelName/:id', async (req, res) => {
    try {
        const { modelName, id } = req.params
        
        const modelNameLowercase = modelName.toLowerCase()
        
        if (!(modelNameLowercase in prisma)) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`
            })
        }
        
        const model = (prisma as any)[modelNameLowercase]
        await model.delete({
            where: { id: parseInt(id) }
        })
        
        res.json({
            success: true,
            message: `${modelName} deleted successfully`
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete record',
            error: (error as Error).message
        })
    }
})

// Helper functions
function parseSchema(schema: string) {
    const models: ParsedModel[] = []
    const enums: ParsedEnum[] = []
    const lines = schema.split('\n')
    
    let currentModel: ParsedModel | null = null
    let currentEnum: ParsedEnum | null = null
    let inModel = false
    let inEnum = false
    
    for (const line of lines) {
        const trimmed = line.trim()
        
        // Model detection
        if (trimmed.startsWith('model ')) {
            inModel = true
            inEnum = false
            const modelName = trimmed.split(' ')[1]
            currentModel = {
                name: modelName,
                fields: [],
                attributes: []
            }
        } else if (trimmed.startsWith('enum ')) {
            inEnum = true
            inModel = false
            const enumName = trimmed.split(' ')[1]
            currentEnum = {
                name: enumName,
                values: []
            }
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
                // Parse field
                const fieldMatch = trimmed.match(/^(\w+)\s+(.+)$/)
                if (fieldMatch) {
                    const [, name, type] = fieldMatch
                    currentModel.fields.push({
                        name,
                        type: type.trim(),
                        raw: trimmed
                    })
                }
            }
        } else if (inEnum && currentEnum && trimmed && !trimmed.startsWith('//')) {
            currentEnum.values.push(trimmed)
        }
    }
    
    return { models, enums }
}

function validateSchema(schema: string) {
    // Basic validation - in a real implementation, you'd use Prisma's validator
    try {
        parseSchema(schema)
        return { valid: true, errors: [] }
    } catch (error) {
        return { valid: false, errors: [(error as Error).message] }
    }
}

function generateModelString(name: string, fields: any[]) {
    let modelString = `model ${name} {\n`
    
    fields.forEach(field => {
        modelString += `  ${field.name} ${field.type}`
        if (field.attributes) {
            modelString += ` ${field.attributes}`
        }
        modelString += '\n'
    })
    
    modelString += '}'
    return modelString
}

function updateModelInSchema(schema: string, modelName: string, fields: any[], attributes: string[]) {
    // This is a simplified implementation
    // In a real scenario, you'd want more sophisticated parsing
    const lines = schema.split('\n')
    const result: string[] = []
    let inTargetModel = false
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()
        
        if (trimmed.startsWith(`model ${modelName}`)) {
            inTargetModel = true
            result.push(line)
        } else if (inTargetModel && trimmed === '}') {
            // Replace model content
            fields.forEach(field => {
                result.push(`  ${field.name} ${field.type}${field.attributes ? ' ' + field.attributes : ''}`)
            })
            attributes.forEach(attr => {
                result.push(`  ${attr}`)
            })
            result.push(line) // closing brace
            inTargetModel = false
        } else if (!inTargetModel) {
            result.push(line)
        }
        // Skip lines inside the target model (they're being replaced)
    }
    
    return result.join('\n')
}

function updateEnumInSchema(schema: string, oldEnumName: string, newEnumName: string, values: string[]) {
    const lines = schema.split('\n')
    const result = []
    let inEnum = false
    
    for (const line of lines) {
        const trimmed = line.trim()
        
        if (trimmed.startsWith(`enum ${oldEnumName}`)) {
            inEnum = true
            result.push(`enum ${newEnumName} {`)
        } else if (inEnum && trimmed === '}') {
            // Add updated values
            values.forEach(value => {
                result.push(`  ${value}`)
            })
            result.push(line)
            inEnum = false
        } else if (!inEnum) {
            result.push(line)
        }
        // Skip lines inside the enum (they're being replaced)
    }
    
    return result.join('\n')
}

export default router 