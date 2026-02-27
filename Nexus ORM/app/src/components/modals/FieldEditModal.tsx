import { useState, useEffect } from 'react'
import { Modal, Button, Input, FormField } from '@/ui'

interface FieldEditModalProps {
  field: { name: string; type: string }
  onSave: (field: { name: string; type: string }) => void
  onCancel: () => void
  modelNames: string[]
  enumNames: string[]
}

const SCALAR_TYPES = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal']

const inputSelectClasses =
  'w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'

export function FieldEditModal({ field, onSave, onCancel, modelNames, enumNames }: FieldEditModalProps) {
  const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '')
  const isRelation = modelNames.includes(baseType)

  const [name, setName] = useState(field.name)
  const [type, setType] = useState(isRelation ? 'Relation' : baseType)
  const [optional, setOptional] = useState(field.type.includes('?'))
  const [unique, setUnique] = useState(field.type.includes('@unique'))
  const [relationModel, setRelationModel] = useState(isRelation ? baseType : '')
  const [isArray, setIsArray] = useState(field.type.includes('[]'))

  useEffect(() => {
    setName(field.name)
    const bt = field.type.split(' ')[0].replace('[]', '').replace('?', '')
    const rel = modelNames.includes(bt)
    setType(rel ? 'Relation' : bt)
    setOptional(field.type.includes('?'))
    setUnique(field.type.includes('@unique'))
    setRelationModel(rel ? bt : '')
    setIsArray(field.type.includes('[]'))
  }, [field, modelNames])

  const handleSave = () => {
    if (!name.trim()) return

    let typeDefinition: string
    if (type === 'Relation') {
      typeDefinition = relationModel
      if (isArray) typeDefinition += '[]'
      if (optional) typeDefinition += '?'
    } else {
      typeDefinition = type
      if (optional) typeDefinition += '?'
      if (unique) typeDefinition += ' @unique'
    }

    onSave({ name: name.trim(), type: typeDefinition })
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Edit Field"
      footer={
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleSave} className="flex-1">
            Save
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Field Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <FormField label="Field Type">
          <select
            value={type}
            onChange={(e) => {
              const v = e.target.value
              const rel = v === 'Relation'
              setType(v)
              setRelationModel(rel ? modelNames[0] ?? '' : '')
              if (rel) setUnique(false)
            }}
            className={inputSelectClasses}
          >
            <optgroup label="Basic Types">
              {SCALAR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
            {enumNames.length > 0 && (
              <optgroup label="Enums">
                {enumNames.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </optgroup>
            )}
            {modelNames.length > 0 && (
              <optgroup label="Relations">
                <option value="Relation">Relation</option>
              </optgroup>
            )}
          </select>
        </FormField>

        {type === 'Relation' && (
          <>
            <FormField label="Related Model">
              <select
                value={relationModel}
                onChange={(e) => setRelationModel(e.target.value)}
                className={inputSelectClasses}
              >
                {modelNames.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </FormField>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isArray} onChange={(e) => setIsArray(e.target.checked)} />
              <span className="text-sm">One-to-many (array)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
              <span className="text-sm">Optional</span>
            </label>
          </>
        )}

        {type !== 'Relation' && (
          <>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
              <span className="text-sm">Optional</span>
            </label>
            {!enumNames.includes(type) && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
                <span className="text-sm">Unique</span>
              </label>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
