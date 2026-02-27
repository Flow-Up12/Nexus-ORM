import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { FieldData } from '@/api/fields'

interface AddFieldModalProps {
  onSave: (field: FieldData) => void
  onCancel: () => void
  modelNames: string[]
  enumNames: string[]
}

const SCALAR_TYPES = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal']

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add New Field</h3>
            <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Field Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. firstName"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Field Type</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
            </div>

            {isRelation && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Related Model</label>
                  <select
                    value={relationModel}
                    onChange={(e) => setRelationModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                    {modelNames.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Foreign Key Name</label>
                  <input
                    type="text"
                    value={foreignKeyName}
                    onChange={(e) => setForeignKeyName(e.target.value)}
                    placeholder="e.g. userId"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
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

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Field
            </button>
            <button onClick={onCancel} className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
