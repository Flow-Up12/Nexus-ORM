import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { fetchSchema } from '@/api/schema'
import { FullSchemaERDiagram } from '@/components/FullSchemaERDiagram'
import type { SchemaData, ParsedModel } from '@/types/schema'

function getRelatedModelNames(model: ParsedModel, allModels: ParsedModel[]): Set<string> {
  const modelNames = allModels.map((m) => m.name)
  const related = new Set<string>([model.name])
  model.fields?.forEach((field) => {
    const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '')
    if (modelNames.includes(baseType) || field.type.includes('@relation')) {
      related.add(baseType)
    }
  })
  return related
}

export function ModelDiagram() {
  const { modelName } = useParams<{ modelName: string }>()
  const { data: schema, isLoading, error } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
  })

  const model = schema?.parsed?.models?.find((m) => m.name === modelName)
  const allModels = schema?.parsed?.models ?? []

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

  const relatedNames = getRelatedModelNames(model, allModels)
  const filteredModels = allModels.filter((m) => relatedNames.has(m.name))
  const filteredSchema: SchemaData = {
    raw: schema!.raw,
    parsed: {
      models: filteredModels,
      enums: schema!.parsed.enums,
    },
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-600 dark:text-slate-400">
        Showing {modelName} and {filteredModels.length - 1} related model(s)
      </p>
      <FullSchemaERDiagram schema={filteredSchema} height="calc(100vh - 320px)" />
    </div>
  )
}
