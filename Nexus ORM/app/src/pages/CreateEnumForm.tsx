import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { createEnum } from '@/api/enums'

export function CreateEnumForm() {
  const navigate = useNavigate()
  const [enumName, setEnumName] = useState('')
  const [values, setValues] = useState<string[]>([''])
  const [newValue, setNewValue] = useState('')

  const addValue = () => {
    const v = newValue.trim()
    if (v && !values.includes(v)) {
      setValues((prev) => [...prev, v])
      setNewValue('')
    }
  }

  const removeValue = (i: number) => {
    setValues((v) => v.filter((_, j) => j !== i))
  }

  const updateValue = (i: number, val: string) => {
    setValues((v) => v.map((x, j) => (j === i ? val : x)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enumName.trim()) {
      toast.error('Enum name is required')
      return
    }
    const validValues = values.filter((v) => v.trim())
    if (validValues.length === 0) {
      toast.error('At least one value is required')
      return
    }
    try {
      await createEnum(enumName.trim(), validValues)
      toast.success('Enum created')
      navigate(`/enum/${enumName.trim()}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Enum</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Add a new Prisma enum</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Enum name</label>
          <input
            type="text"
            value={enumName}
            onChange={(e) => setEnumName(e.target.value)}
            placeholder="e.g. Status"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Values</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg w-40 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
              <button type="button" onClick={addValue} className="inline-flex items-center gap-1 text-indigo-600">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {values.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={v}
                  onChange={(e) => updateValue(i, e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <button type="button" onClick={() => removeValue(i)} className="p-2 text-red-600">
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
            Create Enum
          </button>
          <Link to="/" className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
