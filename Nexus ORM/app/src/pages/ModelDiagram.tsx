import { useParams } from 'react-router-dom'
import { FullSchemaERDiagram } from '@/components/FullSchemaERDiagram'
import { LoadingSpinner, ErrorMessage } from '@/ui'
import { useSchema } from '@/hooks'
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
  const { schema, isLoading, error, models } = useSchema()

  const model = schema?.parsed?.models?.find((m) => m.name === modelName)
  const allModels = models

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !model) {
    return <ErrorMessage message={`Model not found: ${modelName}`} />
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
