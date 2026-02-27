import { useEffect, useRef, useMemo } from 'react'
import mermaid from 'mermaid'
import type { ParsedModel, SchemaData } from '@/types/schema'
import { useTheme } from '@/context/ThemeContext'

interface MermaidERDiagramProps {
  schema: SchemaData
  height?: string
}

function isModelReference(field: { type: string }, modelNames: string[]): boolean {
  const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '')
  return modelNames.includes(baseType)
}

function getRelatedModelName(field: { type: string }): string {
  return field.type.split(' ')[0].replace('[]', '').replace('?', '')
}

function schemaToMermaidEr(schema: SchemaData): string {
  const models = schema?.parsed?.models ?? []
  const modelNames = models.map((m) => m.name)
  const lines: string[] = ['erDiagram']
  const seenRels = new Set<string>()

  models.forEach((model) => {
    model.fields?.forEach((field) => {
      if (field.type.includes('@relation') || isModelReference(field, modelNames)) {
        const targetModel = getRelatedModelName(field)
        if (targetModel && modelNames.includes(targetModel)) {
          const key = `${model.name}-${field.name}-${targetModel}`
          if (seenRels.has(key)) return
          seenRels.add(key)
          const isArray = field.type.includes('[]')
          const isOptional = field.type.includes('?')
          const label = field.name
          // Crow's foot: -- = identifying (solid), .. = non-identifying (dashed)
          // |{ = one or more, o{ = zero or more, || = exactly one, o| = zero or one
          const link = isOptional ? '..' : '--'
          if (isArray) {
            lines.push(`    ${model.name} ||${link}${isOptional ? 'o' : '|'}{ ${targetModel} : "${label}"`)
          } else {
            lines.push(`    ${model.name} ||${link}o| ${targetModel} : "${label}"`)
          }
        }
      }
    })
  })

  const isForeignKey = (model: ParsedModel, fieldName: string): boolean => {
    if (!fieldName.endsWith('Id')) return false
    const relationName = fieldName.replace(/Id$/, '')
    return model.fields?.some(
      (f) => f.name === relationName && (f.type.includes('@relation') || modelNames.includes(f.type.split(' ')[0].replace('[]', '').replace('?', '')))
    ) ?? false
  }

  models.forEach((model) => {
    const attrs = model.fields
      ?.filter((f) => !f.type.includes('@relation') && !modelNames.includes(f.type.split(' ')[0].replace('[]', '').replace('?', '')))
      ?.slice(0, 6)
      ?.map((f) => {
        const baseType = f.type.split(' ')[0].replace('[]', '').replace('?', '')
        const keys: string[] = []
        if (f.type.includes('@id')) keys.push('PK')
        if (isForeignKey(model, f.name)) keys.push('FK')
        const keyStr = keys.length ? ` ${keys.join(', ')}` : ''
        return `    ${baseType} ${f.name}${keyStr}`
      })
    if (attrs && attrs.length > 0) {
      lines.push(`    ${model.name} {`)
      lines.push(...attrs)
      lines.push('    }')
    }
  })

  return lines.join('\n')
}

export function MermaidERDiagram({ schema, height = '600px' }: MermaidERDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(`mermaid-er-${Math.random().toString(36).slice(2)}`)
  const { theme } = useTheme()

  const mermaidCode = useMemo(() => schemaToMermaidEr(schema), [schema])

  useEffect(() => {
    if (!mermaidCode || !containerRef.current) return
    const id = idRef.current
    const container = containerRef.current
    container.innerHTML = ''

    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'neutral',
      er: { useMaxWidth: true },
    })

    mermaid
      .render(id, mermaidCode, container)
      .then(({ svg, bindFunctions }) => {
        if (container) {
          container.innerHTML = svg
          bindFunctions?.(container)
        }
      })
      .catch((err) => {
        if (container) {
          container.innerHTML = `<pre class="p-4 text-red-600 text-sm">Mermaid render error: ${err.message}</pre>`
        }
      })

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [mermaidCode, theme])

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-slate-200 bg-white p-6 overflow-auto dark:border-slate-600 dark:bg-slate-800"
      style={{ minHeight: height }}
    />
  )
}
