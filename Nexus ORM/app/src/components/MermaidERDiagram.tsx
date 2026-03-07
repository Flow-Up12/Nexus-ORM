import { useEffect, useRef, useMemo, useCallback } from 'react'
import mermaid from 'mermaid'
import type { ParsedModel, SchemaData } from '@/types/schema'
import { parseRelations, endToMermaidSymbol } from '@/utils/erdCardinality'
import { useTheme } from '@/context/ThemeContext'

interface MermaidERDiagramProps {
  schema: SchemaData
  height?: string
  onModelClick?: (modelName: string) => void
}

function schemaToMermaidEr(schema: SchemaData): string {
  const models = schema?.parsed?.models ?? []
  const modelNames = models.map((m) => m.name)
  const lines: string[] = ['erDiagram']

  const relations = parseRelations(models)
  relations.forEach((rel) => {
    const fromSym = endToMermaidSymbol(rel.fromEnd)
    const toSym = endToMermaidSymbol(rel.toEnd)
    const link = rel.fromEnd.min === 0 || rel.toEnd.min === 0 ? '..' : '--'
    lines.push(`    ${rel.fromModel} ${fromSym}${link}${toSym} ${rel.toModel} : "${rel.field}"`)
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

export function MermaidERDiagram({ schema, height = '600px', onModelClick }: MermaidERDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(`mermaid-er-${Math.random().toString(36).slice(2)}`)
  const { theme } = useTheme()
  const onModelClickRef = useRef(onModelClick)
  onModelClickRef.current = onModelClick

  const mermaidCode = useMemo(() => schemaToMermaidEr(schema), [schema])
  const modelNames = useMemo(() => (schema?.parsed?.models ?? []).map((m) => m.name), [schema])

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const cb = onModelClickRef.current
    if (!cb) return
    let el: Element | null = e.target as Element
    while (el && el !== containerRef.current) {
      const modelName = el.getAttribute?.('data-erd-model')
      if (modelName) {
        cb(modelName)
        e.preventDefault()
        e.stopPropagation()
        return
      }
      el = el.parentElement
    }
  }, [])

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
          if (onModelClickRef.current && modelNames.length > 0) {
            const svgEl = container.querySelector('svg')
            if (svgEl) {
              const texts = svgEl.querySelectorAll('text')
              texts.forEach((textEl) => {
                const name = textEl.textContent?.trim()
                if (name && modelNames.includes(name)) {
                  let g: Element | null = textEl.parentElement
                  while (g && g.tagName !== 'g') g = g.parentElement
                  if (g?.querySelector('rect')) {
                    g.setAttribute('data-erd-model', name)
                    ;(g as HTMLElement).style.cursor = 'pointer'
                  }
                }
              })
            }
          }
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
  }, [mermaidCode, theme, modelNames])

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800 min-w-0"
      style={{ minHeight: height }}
    />
  )
}
