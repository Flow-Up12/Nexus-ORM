import { useState, useEffect } from 'react'
import type { FieldData } from '@/api/fields'
import { Modal, Button, Input, Select, Checkbox, FieldTypeSelect } from '@/ui'

interface AddFieldModalProps {
  onSave: (field: FieldData) => void
  onCancel: () => void
  modelNames: string[]
  enumNames: string[]
}

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

        <FieldTypeSelect
          value={type}
          onChange={handleTypeChange}
          modelNames={modelNames}
          enumNames={enumNames}
        />

        {isRelation && (
          <>
            <Select
              label="Related Model"
              value={relationModel}
              onChange={(e) => setRelationModel(e.target.value)}
            >
              {modelNames.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <Input
              label="Foreign Key Name"
              value={foreignKeyName}
              onChange={(e) => setForeignKeyName(e.target.value)}
              placeholder="e.g. userId"
            />
            <Checkbox label="One-to-many (array)" checked={isArray} onChange={(e) => setIsArray(e.target.checked)} />
            <Checkbox label="One-to-one" checked={isOneToOne} onChange={(e) => setIsOneToOne(e.target.checked)} />
            <Checkbox label="Optional" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
          </>
        )}

        {!isRelation && (
          <>
            <Checkbox label="Optional" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
            <Checkbox label="Unique" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
          </>
        )}
      </div>
    </Modal>
  )
}
