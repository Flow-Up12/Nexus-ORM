import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { fetchSchema } from '@/api/schema'
import { updateEnum, deleteEnum } from '@/api/enums'

export function EnumEditor() {
  const { enumName } = useParams<{ enumName: string }>()
  const queryClient = useQueryClient()
  const [newValue, setNewValue] = useState('')

  const { data: schema, isLoading, error } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
  })

  const enumDef = schema?.parsed?.enums?.find((e) => e.name === enumName)
  const values = enumDef?.values ?? []

  const updateMutation = useMutation({
    mutationFn: (vals: string[]) => updateEnum(enumName!, vals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema'] })
      toast.success('Enum updated')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEnum(enumName!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema'] })
      toast.success('Enum deleted')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !enumDef) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Enum not found: {enumName}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{enumName}</h1>
        <p className="text-slate-600 mt-1">{values.length} values</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="New value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {values.map((v) => (
            <li
              key={v}
              className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <code className="text-sm text-slate-900 dark:text-slate-100">{v}</code>
              <button
                onClick={() => handleRemove(v)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => {
          if (confirm(`Delete enum ${enumName}?`)) deleteMutation.mutate()
        }}
        className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Delete Enum
      </button>
    </div>
  )
}
