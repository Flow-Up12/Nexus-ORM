import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, ExternalLink } from 'lucide-react'
import type { ParsedModel, SchemaData } from '@/types/schema'
import { fetchRecords } from '@/api/records'

interface EditRecordModalProps {
  model: ParsedModel
  schema: SchemaData
  record: Record<string, unknown>
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  /** When true, render as inline form instead of modal overlay */
  inline?: boolean
}

function getInputType(field: { type: string }, schema: SchemaData): string {
  const type = field.type
  const baseType = type.split(' ')[0].replace('[]', '').replace('?', '')
  const modelNames = schema?.parsed?.models?.map((m) => m.name) ?? []
  const enumNames = schema?.parsed?.enums?.map((e) => e.name) ?? []

  if (enumNames.includes(baseType)) return type.includes('[]') ? 'enumarray' : 'enum'
  if (modelNames.includes(baseType) || type.includes('@relation')) return 'relation'
  if (type.includes('[]')) return 'array'
  const lower = baseType.toLowerCase()
  if (lower.includes('int') || lower.includes('float') || lower.includes('decimal')) return 'number'
  if (lower.includes('boolean')) return 'checkbox'
  if (lower.includes('datetime')) return 'datetime-local'
  if (lower.includes('json')) return 'textarea'
  return 'text'
}

function getForeignKeyName(fieldName: string): string {
  return fieldName + 'Id'
}

function formatRelationDisplay(data: Record<string, unknown>, _modelName: string): string {
  const parts: string[] = []
  const order = ['street', 'city', 'state', 'zipCode', 'name', 'accountNumber']
  for (const k of order) {
    if (data[k] != null && data[k] !== '') parts.push(String(data[k]))
  }
  const rest = Object.entries(data)
    .filter(([k, v]) => !['__create', '__pending', ...order].includes(k) && v != null && v !== '')
    .map(([, v]) => String(v))
  return [...parts, ...rest].join(', ') || 'New record'
}

function hasForeignKeyOnModel(model: ParsedModel, fieldName: string): boolean {
  const fkName = getForeignKeyName(fieldName)
  return model.fields?.some((f) => f.name === fkName) ?? false
}

export function EditRecordModal({ model, schema, record, onSave, onCancel, inline }: EditRecordModalProps) {
  const isCreating = !record.id
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...record })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData({ ...record })
  }, [record])

  const relationFieldNames = new Set(
    model.fields
      ?.filter((f) => f.type.includes('@relation') || schema?.parsed?.models?.some((m) => m.name === f.type.split(' ')[0].replace('[]', '').replace('?', '')))
      ?.map((f) => f.name) ?? []
  )
  const editableFields = model.fields?.filter(
    (f) =>
      !f.type.includes('@id') &&
      !f.type.includes('@updatedAt') &&
      !f.type.includes('@default(now())') &&
      !(f.name.endsWith('Id') && relationFieldNames.has(f.name.replace(/Id$/, ''))) &&
      !(isCreating && f.type.includes('[]'))
  ) ?? []

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const processData = (data: Record<string, unknown>): Record<string, unknown> => {
    const processed: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined || val === '' || val === null) continue
      const field = model.fields?.find((f) => f.name === key)
      if (!field) {
        processed[key] = val
        continue
      }
      const inputType = getInputType(field, schema)
      if (inputType === 'number' && typeof val === 'string') {
        processed[key] = val === '' ? null : Number(val)
      } else if (inputType === 'checkbox' && typeof val === 'string') {
        processed[key] = val.toLowerCase() === 'true'
      } else if (inputType === 'relation') {
        const hasFk = hasForeignKeyOnModel(model, key)
        if (hasFk && val && typeof val === 'object' && 'id' in (val as object) && !Array.isArray(val)) {
          processed[getForeignKeyName(key)] = (val as { id: number }).id
        } else if (!hasFk && val && typeof val === 'object' && !Array.isArray(val)) {
          const v = val as Record<string, unknown>
          if (v.__create === true && !v.__pending) {
            const { __create, __pending, ...nested } = v
            processed[key] = { create: nested }
          } else if ('id' in v && v.id != null) {
            processed[key] = { connect: { id: v.id } }
          }
        }
      } else {
        processed[key] = val
      }
    }
    return processed
  }

  const handleSubmit = () => {
    const requiredScalarFields = editableFields.filter(
      (f) => !f.type.includes('?') && getInputType(f, schema) !== 'relation'
    )
    const missingRequired = requiredScalarFields.filter((f) => {
      const v = formData[f.name]
      return v === undefined || v === '' || v === null
    })
    if (missingRequired.length > 0) return

    const processed = processData(formData)
    if (Object.keys(processed).length === 0) return

    setLoading(true)
    try {
      onSave(processed)
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <form
          className="p-6"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isCreating ? `Create ${model.name}` : `Edit ${model.name}`}
            </h3>
            {!inline && (
              <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {editableFields.map((field) => {
              const inputType = getInputType(field, schema)
              const isRequired = !field.type.includes('?')
              const value = formData[field.name]

              if (inputType === 'relation') {
                return (
                  <RelationField
                    key={field.name}
                    model={model}
                    field={field}
                    schema={schema}
                    value={value}
                    onChange={(v) => handleChange(field.name, v)}
                    required={isRequired && isCreating}
                    recordId={record.id as number | undefined}
                  />
                )
              }

              if (inputType === 'checkbox') {
                return (
                  <div key={field.name} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) => handleChange(field.name, e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.name}</label>
                  </div>
                )
              }

              if (inputType === 'textarea') {
                return (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {field.name} {isRequired && isCreating && '*'}
                    </label>
                    <textarea
                      value={String(value ?? '')}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      rows={3}
                      required={isRequired && isCreating}
                    />
                  </div>
                )
              }

              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {field.name} {isRequired && isCreating && '*'}
                  </label>
                  <input
                    type={inputType === 'number' ? 'number' : inputType}
                    value={value != null ? String(value) : ''}
                    onChange={(e) =>
                      handleChange(
                        field.name,
                        inputType === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    required={isRequired && isCreating}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {inline ? 'View' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isCreating ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
  )

  if (inline) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        {formContent}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {formContent}
      </div>
    </div>
  )
}

function RelationField({
  model,
  field,
  schema,
  value,
  onChange,
  required,
  recordId,
}: {
  model: ParsedModel
  field: { name: string; type: string }
  schema: SchemaData
  value: unknown
  onChange: (v: unknown) => void
  required: boolean
  recordId?: number
}) {
  const targetModelName = field.type.split(' ')[0].replace('[]', '').replace('?', '')
  const isArray = field.type.includes('[]')
  const hasFk = hasForeignKeyOnModel(model, field.name)
  const [options, setOptions] = useState<Array<{ id: number; [k: string]: unknown }>>([])
  const [loading, setLoading] = useState(false)
  const [showCreateNew, setShowCreateNew] = useState(false)

  const targetModel = schema?.parsed?.models?.find((m) => m.name === targetModelName)

  useEffect(() => {
    if (isArray) return
    let cancelled = false
    setLoading(true)
    fetchRecords(targetModelName, { pageSize: 100 })
      .then((res) => {
        if (!cancelled) setOptions((res.data as Array<{ id: number }>) ?? [])
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [targetModelName, isArray])

  const displayField = options[0] ? Object.keys(options[0]).find((k) => k !== 'id' && typeof options[0][k] === 'string') ?? 'id' : 'id'

  const handleCreateNew = (nestedData: Record<string, unknown>) => {
    onChange({ __create: true, ...nestedData })
    setShowCreateNew(false)
  }

  if (isArray) {
    const items = Array.isArray(value) ? value : value ? [value] : []
    const fkField = `${model.name.charAt(0).toLowerCase() + model.name.slice(1)}Id`
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {field.name}
        </label>
        <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 min-h-[2.5rem]">
          {items.length === 0 ? (
            <span className="text-sm text-slate-500 dark:text-slate-400">No linked records</span>
          ) : (
            <ul className="space-y-1">
              {items.map((item: Record<string, unknown>) => {
                const id = item?.id as number | undefined
                const label = formatRelationDisplay(item ?? {}, targetModelName)
                return (
                  <li key={id ?? Math.random()}>
                    {id != null ? (
                      <Link
                        to={`/model/${targetModelName}/record/${id}`}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {label}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {recordId != null && (
            <Link
              to={`/model/${targetModelName}/data?${fkField}=${recordId}`}
              className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View all {targetModelName} →
            </Link>
          )}
        </div>
      </div>
    )
  }

  const selectedId =
    value && typeof value === 'object' && '__create' in value
      ? '__create__'
      : value && typeof value === 'object' && 'id' in value
        ? (value as { id: number }).id
        : value

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {field.name} {required && '*'}
      </label>
      <div className="flex gap-2">
        <select
          value={selectedId != null ? String(selectedId) : ''}
          onChange={(e) => {
            const v = e.target.value
            if (v === '__create__') {
              onChange({ __create: true, __pending: true })
              setShowCreateNew(true)
              return
            }
            const id = v ? Number(v) : null
            const opt = options.find((o) => o.id === id)
            onChange(opt ?? null)
          }}
          className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          disabled={loading}
        >
          <option value="">— Select —</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {String(opt[displayField] ?? opt.id)}
            </option>
          ))}
          {!hasFk && targetModel && (
            <option value="__create__">
              {value && typeof value === 'object' && '__create' in value && !(value as Record<string, unknown>).__pending
                ? formatRelationDisplay(value as Record<string, unknown>, targetModelName)
                : `+ Create New ${targetModelName}`}
            </option>
          )}
        </select>
      </div>

      {showCreateNew &&
        targetModel &&
        createPortal(
          <CreateRelatedModal
            model={targetModel}
            schema={schema}
            onSave={(data) => {
              handleCreateNew(data)
            }}
            onCancel={() => {
              setShowCreateNew(false)
              onChange(null)
            }}
          />,
          document.body
        )}
    </div>
  )
}

function CreateRelatedModal({
  model,
  schema,
  onSave,
  onCancel,
}: {
  model: ParsedModel
  schema: SchemaData
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
}) {
  const [data, setData] = useState<Record<string, unknown>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const relationFieldNames = new Set(
    model.fields
      ?.filter((f) => f.type.includes('@relation') || schema?.parsed?.models?.some((m) => m.name === f.type.split(' ')[0].replace('[]', '').replace('?', '')))
      ?.map((f) => f.name) ?? []
  )
  const scalarFields = model.fields?.filter(
    (f) =>
      !f.type.includes('@id') &&
      !f.type.includes('@updatedAt') &&
      !f.name.endsWith('Id') &&
      !relationFieldNames.has(f.name.replace(/Id$/, ''))
  ) ?? []

  const requiredFields = scalarFields.filter((f) => !f.type.includes('?'))

  const handleChange = (key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSubmit = () => {
    const errors: Record<string, string> = {}
    for (const f of requiredFields) {
      const v = data[f.name]
      if (v === undefined || v === '' || v === null) {
        errors[f.name] = `${f.name} is required`
      }
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    const cleaned: Record<string, unknown> = {}
    scalarFields.forEach((f) => {
      const v = data[f.name]
      if (v !== undefined && v !== '' && v !== null) cleaned[f.name] = v
    })
    onSave(cleaned)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit()
          }}
        >
          <h4 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Create New {model.name}</h4>
          <div className="space-y-3 mb-6">
            {scalarFields.map((f) => {
              const isRequired = !f.type.includes('?')
              const hasError = validationErrors[f.name]
              return (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {f.name} {isRequired && '*'}
                  </label>
                  <input
                    type={f.type.includes('Int') || f.type.includes('Float') || f.type.includes('Decimal') ? 'number' : 'text'}
                    value={String(data[f.name] ?? '')}
                    onChange={(e) => handleChange(f.name, e.target.type === 'number' ? Number(e.target.value) || null : e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                      hasError ? 'border-red-500 dark:border-red-400' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {hasError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{hasError}</p>}
                </div>
              )
            })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCancel()
              }}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create & Select
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
