import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface FieldEditModalProps {
  field: { name: string; type: string }
  onSave: (field: { name: string; type: string }) => void
  onCancel: () => void
  modelNames: string[]
  enumNames: string[]
}

const SCALAR_TYPES = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal']

export function FieldEditModal({ field, onSave, onCancel, modelNames, enumNames }: FieldEditModalProps) {
  const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '')
  const isRelation = modelNames.includes(baseType)
  const isEnum = enumNames.includes(baseType)

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Field</h3>
            <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Field Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Field Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const v = e.target.value
                  const rel = v === 'Relation'
                  setType(v)
                  setRelationModel(rel ? modelNames[0] ?? '' : '')
                  if (rel) setUnique(false)
                }}
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

            {type === 'Relation' && (
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

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Save
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
