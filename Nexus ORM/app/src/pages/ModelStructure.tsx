import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { addField, updateField, deleteField } from '@/api/fields'
import { Key, Link2, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button, Badge, Table, LoadingSpinner, ErrorMessage, BackLink } from '@/ui'
import { AddFieldModal } from '@/components/modals/AddFieldModal'
import { FieldEditModal } from '@/components/modals/FieldEditModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'
import { useSchema, useMutationWithToast } from '@/hooks'
import type { FieldData } from '@/api/fields'

export function ModelStructure() {
  const { modelName } = useParams<{ modelName: string }>()
  const [showAddField, setShowAddField] = useState(false)
  const [editingField, setEditingField] = useState<{ name: string; type: string } | null>(null)
  const [deletingField, setDeletingField] = useState<string | null>(null)

  const { schema, isLoading, error, modelNames, enumNames } = useSchema()
  const model = schema?.parsed?.models?.find((m) => m.name === modelName)
  const filteredModelNames = modelNames.filter((n) => n !== modelName)

  const addMutation = useMutationWithToast({
    mutationFn: (field: FieldData) => addField(modelName!, field),
    invalidateKeys: [['schema']],
    successMessage: 'Field added',
    errorMessage: 'Failed to add field',
    onSuccess: () => setShowAddField(false),
  })

  const updateMutation = useMutationWithToast({
    mutationFn: ({ oldName, newField }: { oldName: string; newField: { name: string; type: string } }) =>
      updateField(modelName!, oldName, newField),
    invalidateKeys: [['schema']],
    successMessage: 'Field updated',
    errorMessage: 'Failed to update field',
    onSuccess: () => setEditingField(null),
  })

  const deleteMutation = useMutationWithToast({
    mutationFn: (fieldName: string) => deleteField(modelName!, fieldName),
    invalidateKeys: [['schema']],
    successMessage: 'Field deleted',
    errorMessage: 'Failed to delete field',
    onSuccess: () => setDeletingField(null),
  })

  if (isLoading) {
    return <LoadingSpinner containerClassName="h-96" />
  }

  if (error || !model) {
    return (
      <div className="space-y-4">
        <BackLink to="/">Back to Dashboard</BackLink>
        <ErrorMessage message={`Model not found: ${modelName}`} />
      </div>
    )
  }

  const isRelation = (field: { type: string }) =>
    field.type.includes('@relation') ||
    schema?.parsed?.models?.some((m) => m.name === field.type.split(' ')[0].replace('[]', '').replace('?', ''))

  const isIdField = (field: { type: string }) => field.type.includes('@id')

  const getBadgeVariant = (type: string): 'string' | 'stringarray' | 'int' | 'intarray' | 'float' | 'boolean' | 'datetime' | 'json' | 'array' | 'relation' | 'enum' | 'enumarray' => {
    const base = type.split(' ')[0].replace('[]', '').replace('?', '')
    const isArray = type.includes('[]')
    if (isRelation({ type })) return 'relation'
    if (enumNames.includes(base)) return isArray ? 'enumarray' : 'enum'
    switch (base) {
      case 'String': return isArray ? 'stringarray' : 'string'
      case 'Int': return isArray ? 'intarray' : 'int'
      case 'Float':
      case 'Decimal': return 'float'
      case 'Boolean': return 'boolean'
      case 'DateTime': return 'datetime'
      case 'Json': return 'json'
      default: return isArray ? 'array' : 'string'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600 dark:text-slate-400">{model.fields?.length ?? 0} fields</p>
        <Button variant="primary" onClick={() => setShowAddField(true)}>
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </div>
      <Table className="overflow-hidden">
        <Table.Thead>
          <Table.HeadRow>
            <Table.HeadCell>Field</Table.HeadCell>
            <Table.HeadCell>Type</Table.HeadCell>
            <Table.HeadCell className="w-24">Actions</Table.HeadCell>
          </Table.HeadRow>
        </Table.Thead>
        <Table.Tbody>
          {model.fields?.map((field) => (
            <Table.BodyRow key={field.name}>
              <Table.BodyCell>
                <div className="flex items-center gap-2">
                  {field.type.includes('@id') ? (
                    <Key className="w-4 h-4 text-amber-500" />
                  ) : isRelation(field) ? (
                    <Link2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  ) : null}
                  <span className="font-medium text-slate-900 dark:text-slate-100">{field.name}</span>
                </div>
              </Table.BodyCell>
              <Table.BodyCell>
                <Badge variant={getBadgeVariant(field.type)}>{field.type}</Badge>
              </Table.BodyCell>
              <Table.BodyCell>
                {!isIdField(field) && (
                  <div className="flex gap-2">
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => setEditingField({ name: field.name, type: field.type })}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => setDeletingField(field.name)}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Table.BodyCell>
            </Table.BodyRow>
          ))}
        </Table.Tbody>
      </Table>

      {showAddField && (
        <AddFieldModal
          onSave={(field) => addMutation.mutate(field)}
          onCancel={() => setShowAddField(false)}
          modelNames={filteredModelNames}
          enumNames={enumNames}
        />
      )}
      {editingField && (
        <FieldEditModal
          field={editingField}
          onSave={(newField) => updateMutation.mutate({ oldName: editingField.name, newField })}
          onCancel={() => setEditingField(null)}
          modelNames={filteredModelNames}
          enumNames={enumNames}
        />
      )}
      {deletingField && (
        <ConfirmDeleteModal
          title={`Delete field "${deletingField}"?`}
          onConfirm={() => deleteMutation.mutate(deletingField)}
          onCancel={() => setDeletingField(null)}
        />
      )}
    </div>
  )
}
