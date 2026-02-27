import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { createModel } from '@/api/models'
import { useQuery } from '@tanstack/react-query'
import { fetchSchema } from '@/api/schema'

export function CreateModelForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [fields, setFields] = useState<Array<{ name: string; type: string; required: boolean; unique: boolean }>>([
    { name: '', type: 'String', required: true, unique: false },
  ])

  const { data: schema } = useQuery({ queryKey: ['schema'], queryFn: fetchSchema })
  const modelNames = schema?.parsed?.models?.map((m) => m.name) ?? []
  const enumNames = schema?.parsed?.enums?.map((e) => e.name) ?? []
  const scalarTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal']

  const addField = () => {
    setFields((f) => [...f, { name: '', type: 'String', required: true, unique: false }])
  }

  const removeField = (i: number) => {
    setFields((f) => f.filter((_, j) => j !== i))
  }

  const updateField = (i: number, key: string, value: string | boolean) => {
    setFields((f) => f.map((field, j) => (j === i ? { ...field, [key]: value } : field)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Model name is required')
      return
    }
    const validFields = fields.filter((f) => f.name.trim())
    if (validFields.length === 0) {
      toast.error('At least one field is required')
      return
    }
    try {
      await createModel(
        name.trim(),
        validFields.map((f) => ({
          name: f.name.trim(),
          type: f.type,
          required: f.required,
          unique: f.unique,
        }))
      )
      toast.success('Model created')
      navigate(`/model/${name.trim()}/data`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    }
  }

  const typeOptions = [...scalarTypes, ...modelNames, ...enumNames]

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Model</h1>
        <p className="text-slate-600 mt-1">Add a new Prisma model</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Product"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fields</label>
            <button type="button" onClick={addField} className="inline-flex items-center gap-1 text-indigo-600">
              <Plus className="w-4 h-4" />
              Add field
            </button>
          </div>
          <div className="space-y-4">
            {fields.map((field, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder="Field name"
                  value={field.name}
                  onChange={(e) => updateField(i, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(i, 'type', e.target.value)}
                  className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(i, 'required', e.target.checked)}
                  />
                  <span className="text-sm">Required</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={field.unique}
                    onChange={(e) => updateField(i, 'unique', e.target.checked)}
                  />
                  <span className="text-sm">Unique</span>
                </label>
                <button type="button" onClick={() => removeField(i)} className="p-2 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Model
          </button>
          <Link to="/" className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
