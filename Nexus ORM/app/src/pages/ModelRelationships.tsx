import { useParams, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { LoadingSpinner, ErrorMessage, Card, Table } from '@/ui'
import { useSchema } from '@/hooks'
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
  const { schema, isLoading, error } = useSchema()

  const model = schema?.parsed?.models?.find((m) => m.name === modelName)
  const relationships = model && schema ? getRelationships(model, schema) : []

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !model) {
    return <ErrorMessage message={`Model not found: ${modelName}`} />
  }

  if (relationships.length === 0) {
    return (
      <Card className="text-center text-slate-600 dark:text-slate-400">
        No relationships defined for this model
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Table padding={false} className="overflow-hidden">
        <Table.Thead>
          <Table.HeadRow>
            <Table.HeadCell>Field</Table.HeadCell>
            <Table.HeadCell>Type</Table.HeadCell>
            <Table.HeadCell>Related Model</Table.HeadCell>
            <Table.HeadCell>Cardinality</Table.HeadCell>
            <Table.HeadCell>Action</Table.HeadCell>
          </Table.HeadRow>
        </Table.Thead>
        <Table.Tbody>
          {relationships.map((rel) => (
            <Table.BodyRow key={rel.field}>
              <Table.BodyCell>
                <span className="font-medium text-slate-900 dark:text-slate-100">{rel.field}</span>
              </Table.BodyCell>
              <Table.BodyCell>
                <code className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded">
                  {rel.target}{rel.isArray ? '[]' : ''}{rel.isOptional ? '?' : ''}
                </code>
              </Table.BodyCell>
              <Table.BodyCell className="text-slate-700 dark:text-slate-300">{rel.target}</Table.BodyCell>
              <Table.BodyCell>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {rel.isArray ? 'One-to-Many' : 'One-to-One'}
                  {rel.isOptional && ' (optional)'}
                </span>
              </Table.BodyCell>
              <Table.BodyCell>
                <Link
                  to={`/model/${rel.target}/data`}
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  View <ArrowRight className="w-4 h-4" />
                </Link>
              </Table.BodyCell>
            </Table.BodyRow>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  )
}
