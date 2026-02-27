import { useState, useEffect } from 'react'
import { Modal, Button, Input, Select, Checkbox, FieldTypeSelect } from '@/ui'

interface FieldEditModalProps {
  field: { name: string; type: string }
  onSave: (field: { name: string; type: string }) => void
  onCancel: () => void
  modelNames: string[]
  enumNames: string[]
}

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

        <FieldTypeSelect
          value={type}
          onChange={(v) => {
            const rel = v === 'Relation'
            setType(v)
            setRelationModel(rel ? modelNames[0] ?? '' : '')
            if (rel) setUnique(false)
          }}
          modelNames={modelNames}
          enumNames={enumNames}
        />

        {type === 'Relation' && (
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
            <Checkbox label="One-to-many (array)" checked={isArray} onChange={(e) => setIsArray(e.target.checked)} />
            <Checkbox label="Optional" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
          </>
        )}

        {type !== 'Relation' && (
          <>
            <Checkbox label="Optional" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
            {!enumNames.includes(type) && (
              <Checkbox label="Unique" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
