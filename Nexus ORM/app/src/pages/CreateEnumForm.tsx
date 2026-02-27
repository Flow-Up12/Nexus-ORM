import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createEnum } from '@/api/enums'
import { Card, Input, Button, PageHeader } from '@/ui'

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
      <PageHeader
        title="Create Enum"
        description="Add a new Prisma enum"
        backTo="/"
        backLabel="Back to Dashboard"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Enum name"
            value={enumName}
            onChange={(e) => setEnumName(e.target.value)}
            placeholder="e.g. Status"
            required
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Values</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                  className="w-40"
                />
                <Button variant="ghost" size="sm" type="button" onClick={addValue}>
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {values.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={v}
                    onChange={(e) => updateValue(i, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => removeValue(i)}
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
              Create Enum
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
