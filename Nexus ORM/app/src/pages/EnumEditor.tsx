import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { updateEnum, deleteEnum } from '@/api/enums'
import { Card, Input, Button, PageHeader, LoadingSpinner, ErrorMessage, BackLink } from '@/ui'
import { useSchema, useMutationWithToast } from '@/hooks'

export function EnumEditor() {
  const { enumName } = useParams<{ enumName: string }>()
  const [newValue, setNewValue] = useState('')

  const { schema, isLoading, error } = useSchema()
  const enumDef = schema?.parsed?.enums?.find((e) => e.name === enumName)
  const values = enumDef?.values ?? []

  const updateMutation = useMutationWithToast({
    mutationFn: (vals: string[]) => updateEnum(enumName!, vals),
    invalidateKeys: [['schema']],
    successMessage: 'Enum updated',
    errorMessage: 'Update failed',
  })

  const deleteMutation = useMutationWithToast({
    mutationFn: () => deleteEnum(enumName!),
    invalidateKeys: [['schema']],
    successMessage: 'Enum deleted',
    errorMessage: 'Delete failed',
  })

  const handleAdd = () => {
    const v = newValue.trim()
    if (!v) return
    if (values.includes(v)) {
      toast.error('Value already exists')
      return
    }
    updateMutation.mutate([...values, v])
    setNewValue('')
  }

  const handleRemove = (value: string) => {
    updateMutation.mutate(values.filter((v) => v !== value))
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !enumDef) {
    return (
      <div className="space-y-4">
        <BackLink to="/">Back to Dashboard</BackLink>
        <ErrorMessage message={`Enum not found: ${enumName}`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={enumName ?? ''}
        description={`${values.length} values`}
        backTo="/"
        backLabel="Back to Dashboard"
      />

      <Card>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="New value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="flex-1"
          />
          <Button variant="primary" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
        <ul className="space-y-2">
          {values.map((v) => (
            <li
              key={v}
              className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <code className="text-sm text-slate-900 dark:text-slate-100">{v}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(v)}
                className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Button
        variant="danger"
        onClick={() => {
          if (confirm(`Delete enum ${enumName}?`)) deleteMutation.mutate()
        }}
      >
        Delete Enum
      </Button>
    </div>
  )
}
