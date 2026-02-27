import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchSchema } from '@/api/schema'
import { addField, updateField, deleteField } from '@/api/fields'
import { Loader2, ArrowLeft, Key, Link2, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button, Badge, Table } from '@/ui'
import { AddFieldModal } from '@/components/modals/AddFieldModal'
import { FieldEditModal } from '@/components/modals/FieldEditModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'
import type { FieldData } from '@/api/fields'

export function ModelStructure() {
  const { modelName } = useParams<{ modelName: string }>()
  const queryClient = useQueryClient()
  const [showAddField, setShowAddField] = useState(false)
  const [editingField, setEditingField] = useState<{ name: string; type: string } | null>(null)
  const [deletingField, setDeletingField] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
  })

  const addMutation = useMutation({
    mutationFn: (field: FieldData) => addField(modelName!, field),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema'] })
      toast.success('Field added')
      setShowAddField(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to add field'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ oldName, newField }: { oldName: string; newField: { name: string; type: string } }) =>
      updateField(modelName!, oldName, newField),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema'] })
      toast.success('Field updated')
      setEditingField(null)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to update field'),
  })

  const deleteMutation = useMutation({
    mutationFn: (fieldName: string) => deleteField(modelName!, fieldName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema'] })
      toast.success('Field deleted')
      setDeletingField(null)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to delete field'),
  })

  const model = data?.parsed?.models?.find((m) => m.name === modelName)
  const modelNames = data?.parsed?.models?.map((m) => m.name).filter((n) => n !== modelName) ?? []
  const enumNames = data?.parsed?.enums?.map((e) => e.name) ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          Model not found: {modelName}
        </div>
      </div>
    )
  }

  const isRelation = (field: { type: string }) =>
    field.type.includes('@relation') ||
    data?.parsed?.models?.some((m) => m.name === field.type.split(' ')[0].replace('[]', '').replace('?', ''))

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
          modelNames={modelNames}
          enumNames={enumNames}
        />
      )}
      {editingField && (
        <FieldEditModal
          field={editingField}
          onSave={(newField) => updateMutation.mutate({ oldName: editingField.name, newField })}
          onCancel={() => setEditingField(null)}
          modelNames={modelNames}
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
