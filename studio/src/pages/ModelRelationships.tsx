import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Link2, ArrowRight } from 'lucide-react'
import { fetchSchema } from '@/api/schema'
import type { ParsedModel, SchemaData } from '@/types/schema'

function getRelationships(model: ParsedModel, schema: SchemaData) {
  const modelNames = schema?.parsed?.models?.map((m) => m.name) ?? []
  const rels: Array<{ field: string; target: string; isArray: boolean; isOptional: boolean }> = []
  model.fields?.forEach((field) => {
    const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '')
    if (modelNames.includes(baseType) || field.type.includes('@relation')) {
      rels.push({
        field: field.name,
        target: baseType,
        isArray: field.type.includes('[]'),
        isOptional: field.type.includes('?'),
      })
    }
  })
  return rels
}

export function ModelRelationships() {
  const { modelName } = useParams<{ modelName: string }>()
  const { data: schema, isLoading, error } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
  })

  const model = schema?.parsed?.models?.find((m) => m.name === modelName)
  const relationships = model && schema ? getRelationships(model, schema) : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
        Model not found: {modelName}
      </div>
    )
  }

  if (relationships.length === 0) {
    return (
      <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-center text-slate-600 dark:text-slate-400">
        No relationships defined for this model
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Field</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Type</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Related Model</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Cardinality</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {relationships.map((rel) => (
              <tr key={rel.field} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-6 py-4">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{rel.field}</span>
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded">
                    {rel.target}{rel.isArray ? '[]' : ''}{rel.isOptional ? '?' : ''}
                  </code>
                </td>
                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{rel.target}</td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {rel.isArray ? 'One-to-Many' : 'One-to-One'}
                    {rel.isOptional && ' (optional)'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/model/${rel.target}/data`}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    View <ArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
