import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchSchema } from '@/api/schema'
import { addField, updateField, deleteField } from '@/api/fields'
import { Loader2, ArrowLeft, Key, Link2, Plus, Pencil, Trash2 } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-600 dark:text-slate-400">{model.fields?.length ?? 0} fields</p>
        <button
          onClick={() => setShowAddField(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Field</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Type</th>
              <th className="w-24 px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {model.fields?.map((field) => (
              <tr key={field.name} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {field.type.includes('@id') ? (
                      <Key className="w-4 h-4 text-amber-500" />
                    ) : isRelation(field) ? (
                      <Link2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    ) : null}
                    <span className="font-medium text-slate-900 dark:text-slate-100">{field.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded">{field.type}</code>
                </td>
                <td className="px-6 py-4">
                  {!isIdField(field) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingField({ name: field.name, type: field.type })}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingField(field.name)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
