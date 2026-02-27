import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createModel } from '@/api/models'
import { Card, Input, Select, Button, PageHeader, Checkbox } from '@/ui'
import { useSchema } from '@/hooks'

export function CreateModelForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [fields, setFields] = useState<Array<{ name: string; type: string; required: boolean; unique: boolean }>>([
    { name: '', type: 'String', required: true, unique: false },
  ])

  const { modelNames, enumNames } = useSchema()
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
      <PageHeader
        title="Create Model"
        description="Add a new Prisma model"
        backTo="/"
        backLabel="Back to Dashboard"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Model name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Product"
            required
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fields</label>
              <Button variant="ghost" size="sm" type="button" onClick={addField}>
                <Plus className="w-4 h-4" />
                Add field
              </Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => updateField(i, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={field.type}
                    onChange={(e) => updateField(i, 'type', e.target.value)}
                    className="w-32"
                  >
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                  <Checkbox
                    label="Required"
                    checked={field.required}
                    onChange={(e) => updateField(i, 'required', e.target.checked)}
                  />
                  <Checkbox
                    label="Unique"
                    checked={field.unique}
                    onChange={(e) => updateField(i, 'unique', e.target.checked)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => removeField(i)}
                    className="text-red-600 dark:text-red-400 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              Create Model
            </Button>
            <Link to="/">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
