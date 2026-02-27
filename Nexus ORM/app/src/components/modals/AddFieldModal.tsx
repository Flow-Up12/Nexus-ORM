import { useState, useEffect } from 'react'
import type { FieldData } from '@/api/fields'
import { Modal, Button, Input, FormField } from '@/ui'

interface AddFieldModalProps {
  onSave: (field: FieldData) => void
  onCancel: () => void
  modelNames: string[]
  enumNames: string[]
}

const SCALAR_TYPES = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal']

const inputSelectClasses =
  'w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'

export function AddFieldModal({ onSave, onCancel, modelNames, enumNames }: AddFieldModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('String')
  const [optional, setOptional] = useState(false)
  const [unique, setUnique] = useState(false)
  const [isRelation, setIsRelation] = useState(false)
  const [relationModel, setRelationModel] = useState('')
  const [isArray, setIsArray] = useState(false)
  const [isOneToOne, setIsOneToOne] = useState(false)
  const [foreignKeyName, setForeignKeyName] = useState('')

  useEffect(() => {
    if (isRelation && name) {
      setForeignKeyName(`${name}Id`)
    }
  }, [isRelation, name])

  const handleTypeChange = (v: string) => {
    const rel = v === 'Relation'
    setType(v)
    setIsRelation(rel)
    if (rel) setRelationModel(modelNames[0] ?? '')
    if (rel) setUnique(false)
  }

  const handleSave = () => {
    if (!name.trim()) return
    if (isRelation && !relationModel) return
    if (isRelation && !foreignKeyName.trim()) return

    let typeDefinition: string
    let relationMetadata: FieldData['relationMetadata']

    if (isRelation) {
      typeDefinition = relationModel
      if (isArray) typeDefinition += '[]'
      if (optional) typeDefinition += '?'
      relationMetadata = {
        targetModel: relationModel,
        isArray,
        isOneToOne,
        relationType: 'implicit',
        foreignKeyName: foreignKeyName.trim() || `${name}Id`,
      }
    } else {
      typeDefinition = type
      if (optional) typeDefinition += '?'
      if (unique) typeDefinition += ' @unique'
    }

    onSave({
      name: name.trim(),
      type: typeDefinition,
      relationMetadata,
    })
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Add New Field"
      footer={
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleSave} className="flex-1">
            Add Field
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
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. firstName"
        />

        <FormField label="Field Type">
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
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

        {isRelation && (
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
            <Input
              label="Foreign Key Name"
              value={foreignKeyName}
              onChange={(e) => setForeignKeyName(e.target.value)}
              placeholder="e.g. userId"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isArray}
                onChange={(e) => setIsArray(e.target.checked)}
              />
              <span className="text-sm">One-to-many (array)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isOneToOne}
                onChange={(e) => setIsOneToOne(e.target.checked)}
              />
              <span className="text-sm">One-to-one</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={optional}
                onChange={(e) => setOptional(e.target.checked)}
              />
              <span className="text-sm">Optional</span>
            </label>
          </>
        )}

        {!isRelation && (
          <>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
              <span className="text-sm">Optional</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
              <span className="text-sm">Unique</span>
            </label>
          </>
        )}
      </div>
    </Modal>
  )
}
