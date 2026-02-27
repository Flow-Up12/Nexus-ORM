import { Router } from 'express'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const router = Router()

// Auth middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
    // Always bypass in development or when no NODE_ENV is set
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        return next()
    }
    
    // Check for token in authorization header or cookie
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1] || req.cookies?.adminToken
    
    if (!token || token !== 'admin-token') {
        return res.status(401).json({ message: 'Access denied' })
    }
    next()
}

// Helper function to parse and modify schema
function parseSchemaFile() {
    const schemaPath = join(__dirname, '../../../../libs/prisma/src/schema')
    const content = readFileSync(schemaPath, 'utf-8')
    return { content, schemaPath }
}

function writeSchemaFile(content: string, schemaPath: string) {
    writeFileSync(schemaPath, content, 'utf-8')
}

// Add a new field to a model
router.post('/field', authenticateAdmin, (req, res) => {
    try {
        const { modelName, field } = req.body
        
        if (!modelName || !field || !field.name || !field.type) {
            return res.status(400).json({
                success: false,
                message: 'Model name, field name, and field type are required'
            })
        }
        
        const { content, schemaPath } = parseSchemaFile()
        const lines = content.split('\n')
        
        // Find the model
        let modelStartIndex = -1
        let modelEndIndex = -1
        let inModel = false
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            
            if (line.startsWith(`model ${modelName}`)) {
                modelStartIndex = i
                inModel = true
            } else if (inModel && line === '}') {
                modelEndIndex = i
                break
            }
        }
        
        if (modelStartIndex === -1 || modelEndIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`
            })
        }
        
        // Check if field already exists
        for (let i = modelStartIndex + 1; i < modelEndIndex; i++) {
            const line = lines[i].trim()
            if (line.startsWith(field.name + ' ')) {
                return res.status(400).json({
                    success: false,
                    message: `Field ${field.name} already exists`
                })
            }
        }
        
        // Add the new field before the closing brace
        const fieldLine = `  ${field.name} ${field.type}`
        lines.splice(modelEndIndex, 0, fieldLine)
        
        const newContent = lines.join('\n')
        writeSchemaFile(newContent, schemaPath)
        
        res.json({
            success: true,
            message: 'Field added successfully'
        })
    } catch (error) {
        console.error('Add field error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to add field',
            error: (error as Error).message
        })
    }
})

// Update an existing field
router.put('/field', authenticateAdmin, (req, res) => {
    try {
        const { modelName, oldFieldName, newField } = req.body
        
        if (!modelName || !oldFieldName || !newField || !newField.name || !newField.type) {
            return res.status(400).json({
                success: false,
                message: 'Model name, old field name, new field name, and new field type are required'
            })
        }
        
        const { content, schemaPath } = parseSchemaFile()
        let lines = content.split('\n')
        
        // Check if this is a relation field
        const isRelationField = newField.relationMetadata && newField.relationMetadata.targetModel
        const fieldDefinition = `  ${newField.name} ${newField.type}`
        
        if (isRelationField) {
            const targetModel = newField.relationMetadata.targetModel
            const isArray = newField.relationMetadata.isArray
            const relationType = newField.relationMetadata.relationType || 'implicit'
            
            if (relationType === 'implicit') {
                // Add bidirectional relationship to target model
                const reverseFieldName = modelName.toLowerCase() + (isArray ? 's' : '')
                const reverseFieldType = isArray ? modelName : `${modelName}[]`
                const reverseFieldDef = `  ${reverseFieldName} ${reverseFieldType}`
                
                // Find target model and add reverse relationship using line-by-line approach
                const result: string[] = []
                let inTargetModel = false
                let targetModelFound = false
                let bracesCount = 0
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i]
                    
                    // Check if we're entering the target model
                    if (line.match(new RegExp(`^\\s*model\\s+${targetModel}\\s*\\{`))) {
                        inTargetModel = true
                        targetModelFound = true
                        bracesCount = 1
                        result.push(line)
                        continue
                    }
                    
                    // Track brace count to know when we exit the model
                    if (inTargetModel) {
                        if (line.includes('{')) bracesCount++
                        if (line.includes('}')) bracesCount--
                        
                        if (bracesCount === 0) {
                            // We're at the closing brace, add reverse field before it if not exists
                            if (!result.some(l => l.includes(reverseFieldName))) {
                                result.push(reverseFieldDef)
                            }
                            inTargetModel = false
                            result.push(line)
                            continue
                        }
                    }
                    
                    result.push(line)
                }
                
                lines = result
                
                if (!targetModelFound) {
                    console.log(`Warning: Target model ${targetModel} not found for bidirectional relationship`)
                }
            }
        }
        
        // Find the model and field
        let modelStartIndex = -1
        let modelEndIndex = -1
        let fieldIndex = -1
        let inModel = false
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            
            if (line.startsWith(`model ${modelName}`)) {
                modelStartIndex = i
                inModel = true
            } else if (inModel && line === '}') {
                modelEndIndex = i
                break
            } else if (inModel && line.startsWith(oldFieldName + ' ')) {
                fieldIndex = i
            }
        }
        
        if (modelStartIndex === -1 || modelEndIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`
            })
        }
        
        if (fieldIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Field ${oldFieldName} not found`
            })
        }
        
        // Update the field
        lines[fieldIndex] = fieldDefinition
        
        const newContent = lines.join('\n')
        writeSchemaFile(newContent, schemaPath)
        
        res.json({
            success: true,
            message: 'Field updated successfully'
        })
    } catch (error) {
        console.error('Update field error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update field',
            error: (error as Error).message
        })
    }
})

// Delete a field from a model
router.delete('/field', authenticateAdmin, (req, res) => {
    try {
        const { modelName, fieldName } = req.body
        
        if (!modelName || !fieldName) {
            return res.status(400).json({
                success: false,
                message: 'Model name and field name are required'
            })
        }
        
        const { content, schemaPath } = parseSchemaFile()
        const lines = content.split('\n')
        
        // Find the model and field
        let modelStartIndex = -1
        let modelEndIndex = -1
        let fieldIndex = -1
        let inModel = false
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            
            if (line.startsWith(`model ${modelName}`)) {
                modelStartIndex = i
                inModel = true
            } else if (inModel && line === '}') {
                modelEndIndex = i
                break
            } else if (inModel && line.startsWith(fieldName + ' ')) {
                fieldIndex = i
            }
        }
        
        if (modelStartIndex === -1 || modelEndIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Model ${modelName} not found`
            })
        }
        
        if (fieldIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Field ${fieldName} not found`
            })
        }
        
        // Remove the field
        lines.splice(fieldIndex, 1)
        
        const newContent = lines.join('\n')
        writeSchemaFile(newContent, schemaPath)
        
        res.json({
            success: true,
            message: 'Field deleted successfully'
        })
    } catch (error) {
        console.error('Delete field error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete field',
            error: (error as Error).message
        })
    }
})

// Add a new enum
router.post('/enum', authenticateAdmin, (req, res) => {
    try {
        const { enumName, values } = req.body
        
        if (!enumName || !values || !Array.isArray(values) || values.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Enum name and values array are required'
            })
        }
        
        const { content, schemaPath } = parseSchemaFile()
        
        // Check if enum already exists
        if (content.includes(`enum ${enumName}`)) {
            return res.status(400).json({
                success: false,
                message: `Enum ${enumName} already exists`
            })
        }
        
        // Create enum definition
        const enumDef = [
            '',
            `enum ${enumName} {`,
            ...values.map(value => `  ${value}`),
            '}'
        ].join('\n')
        
        // Append to the end of the file
        const newContent = content + enumDef
        writeSchemaFile(newContent, schemaPath)
        
        res.json({
            success: true,
            message: 'Enum added successfully'
        })
    } catch (error) {
        console.error('Add enum error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to add enum',
            error: (error as Error).message
        })
    }
})

// Update an existing enum
router.put('/enum', authenticateAdmin, (req, res) => {
    try {
        const { enumName, values } = req.body
        
        if (!enumName || !values || !Array.isArray(values) || values.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Enum name and values array are required'
            })
        }
        
        const { content, schemaPath } = parseSchemaFile()
        const lines = content.split('\n')
        
        // Find the enum
        let enumStartIndex = -1
        let enumEndIndex = -1
        let inEnum = false
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            
            if (line.startsWith(`enum ${enumName}`)) {
                enumStartIndex = i
                inEnum = true
            } else if (inEnum && line === '}') {
                enumEndIndex = i
                break
            }
        }
        
        if (enumStartIndex === -1 || enumEndIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Enum ${enumName} not found`
            })
        }
        
        // Replace enum content
        const newEnumLines = values.map(value => `  ${value}`)
        
        // Remove old enum content and insert new
        lines.splice(enumStartIndex + 1, enumEndIndex - enumStartIndex - 1, ...newEnumLines)
        
        const newContent = lines.join('\n')
        writeSchemaFile(newContent, schemaPath)
        
        res.json({
            success: true,
            message: 'Enum updated successfully'
        })
    } catch (error) {
        console.error('Update enum error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update enum',
            error: (error as Error).message
        })
    }
})

// Delete an enum
router.delete('/enum', authenticateAdmin, (req, res) => {
    try {
        const { enumName } = req.body
        
        if (!enumName) {
            return res.status(400).json({
                success: false,
                message: 'Enum name is required'
            })
        }
        
        const { content, schemaPath } = parseSchemaFile()
        const lines = content.split('\n')
        
        // Find the enum
        let enumStartIndex = -1
        let enumEndIndex = -1
        let inEnum = false
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            
            if (line.startsWith(`enum ${enumName}`)) {
                enumStartIndex = i
                inEnum = true
            } else if (inEnum && line === '}') {
                enumEndIndex = i
                break
            }
        }
        
        if (enumStartIndex === -1 || enumEndIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Enum ${enumName} not found`
            })
        }
        
        // Remove the entire enum (including any empty lines before it)
        let removeStart = enumStartIndex
        if (removeStart > 0 && lines[removeStart - 1].trim() === '') {
            removeStart--
        }
        
        lines.splice(removeStart, enumEndIndex - removeStart + 1)
        
        const newContent = lines.join('\n')
        writeSchemaFile(newContent, schemaPath)
        
        res.json({
            success: true,
            message: 'Enum deleted successfully'
        })
    } catch (error) {
        console.error('Delete enum error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete enum',
            error: (error as Error).message
        })
    }
})

// Generate Prisma client after schema changes
router.post('/generate', authenticateAdmin, async (req, res) => {
    try {
        
        // Run prisma generate
        const schemaPath = join(__dirname, '../../../../libs/prisma/src/schema/schema.prisma')
        const { stdout, stderr } = await execAsync(`npx prisma generate --schema="${schemaPath}"`, {
            cwd: process.cwd()
        })
        
        res.json({
            success: true,
            message: 'Prisma client generated successfully',
            output: stdout,
            error: stderr
        })
    } catch (error) {
        console.error('Generate error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to generate Prisma client',
            error: (error as Error).message
        })
    }
})

// Run database migration
router.post('/migrate', authenticateAdmin, async (req, res) => {
    try {
        const { name } = req.body
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Migration name is required'
            })
        }
        
        
        // Run prisma migrate dev
        const schemaPath = join(__dirname, '../../../../libs/prisma/src/schema/schema.prisma')
        const { stdout, stderr } = await execAsync(`npx prisma migrate dev --name "${name}" --schema="${schemaPath}"`, {
            cwd: process.cwd()
        })
        
        res.json({
            success: true,
            message: 'Migration completed successfully',
            output: stdout,
            error: stderr
        })
    } catch (error) {
        console.error('Migration error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to run migration',
            error: (error as Error).message
        })
    }
})

// Get raw schema content
router.get('/raw', authenticateAdmin, (req, res) => {
    try {
        const { content } = parseSchemaFile()
        res.json({
            success: true,
            content: content
        })
    } catch (error) {
        console.error('Get raw schema error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to load schema',
            error: (error as Error).message
        })
    }
})

// Save raw schema content
router.post('/raw', authenticateAdmin, (req, res) => {
    try {
        const { content } = req.body
        
        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Schema content is required'
            })
        }
        
        const { schemaPath } = parseSchemaFile()
        writeSchemaFile(content, schemaPath)
        
        res.json({
            success: true,
            message: 'Schema saved successfully'
        })
    } catch (error) {
        console.error('Save raw schema error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to save schema',
            error: (error as Error).message
        })
    }
})

// Create a new model
router.post('/model', authenticateAdmin, (req, res) => {
    try {
        const { name, fields } = req.body
        
        if (!name || !fields || !Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Model name and fields array are required'
            })
        }
        
        const { content, schemaPath } = parseSchemaFile()
        
        // Check if model already exists
        if (content.includes(`model ${name}`)) {
            return res.status(400).json({
                success: false,
                message: `Model ${name} already exists`
            })
        }
        
        // Build model definition
        const modelLines = [
            '',
            `model ${name} {`,
            '  id Int @id @default(autoincrement())',
            ...fields.map(field => {
                let fieldLine = `  ${field.name} ${field.type}`
                if (!field.required) fieldLine += '?'
                if (field.unique) fieldLine += ' @unique'
                return fieldLine
            }),
            '  createdAt DateTime @default(now())',
            '  updatedAt DateTime @updatedAt',
            '}'
        ]
        
        // Append to the end of the file
        const newContent = content + modelLines.join('\n')
        writeSchemaFile(newContent, schemaPath)
        
        res.json({
            success: true,
            message: 'Model created successfully'
        })
    } catch (error) {
        console.error('Create model error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to create model',
            error: (error as Error).message
        })
    }
})

export default router 