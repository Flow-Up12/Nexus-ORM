import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Pencil, Trash2, ExternalLink, Eye } from 'lucide-react'
import { fetchSchema } from '@/api/schema'
import { fetchRecord, updateRecord, deleteRecord } from '@/api/records'
import { EditRecordModal } from '@/components/modals/EditRecordModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'
import type { ParsedModel, ParsedField, SchemaData } from '@/types/schema'

function isRelationField(field: ParsedField, schema: SchemaData): boolean {
  const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '')
  return (
    field.type.includes('@relation') ||
    (schema?.parsed?.models?.some((m) => m.name === baseType) ?? false)
  )
}

function getRelationTargetModel(field: ParsedField): string {
  return field.type.split(' ')[0].replace('[]', '').replace('?', '')
}

function formatValue(val: unknown): string {
  if (val == null) return '—'
  if (typeof val === 'object' && !Array.isArray(val)) {
    const r = val as Record<string, unknown>
    const parts = ['street', 'city', 'state', 'zipCode', 'name', 'accountNumber']
      .filter((k) => r[k] != null && r[k] !== '')
      .map((k) => String(r[k]))
    if (parts.length) return parts.join(', ')
    if (r.id != null) return `#${r.id}`
    return JSON.stringify(val)
  }
  if (Array.isArray(val)) return val.length ? `${val.length} item(s)` : '—'
  return String(val)
}

interface RecordDetailProps {
  mode: 'show' | 'edit'
}

export function RecordDetail({ mode }: RecordDetailProps) {
  const { modelName, id } = useParams<{ modelName: string; id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState(false)

  const { data: schema } = useQuery({ queryKey: ['schema'], queryFn: fetchSchema })
  const model = schema?.parsed?.models?.find((m) => m.name === modelName)

  const relationFields = model?.fields?.filter((f) => isRelationField(f, schema!)) ?? []
  const populateStr = relationFields.map((f) => f.name).join(',')

  const { data, isLoading, error } = useQuery({
    queryKey: ['record', modelName, id, populateStr],
    queryFn: () => fetchRecord(modelName!, id!, populateStr || undefined),
    enabled: !!modelName && !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      updateRecord(modelName!, id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record', modelName, id] })
      queryClient.invalidateQueries({ queryKey: ['records', modelName] })
      toast.success('Record updated')
      navigate(`/model/${modelName}/record/${id}/show`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecord(modelName!, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', modelName] })
      toast.success('Record deleted')
      navigate(`/model/${modelName}/data`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
  })

  if (!modelName || !id || !model) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to={`/model/${modelName}/data`}
          className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Data
        </Link>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          Failed to load record
        </div>
      </div>
    )
  }

  const record = (data?.data ?? {}) as Record<string, unknown>

  const scalarFields = model.fields?.filter(
    (f) =>
      !isRelationField(f, schema!) &&
      !(f.name.endsWith('Id') && model.fields?.some((o) => o.name === f.name.replace(/Id$/, '')))
  ) ?? []

  const showPath = `/model/${modelName}/record/${id}/show`
  const editPath = `/model/${modelName}/record/${id}/edit`

  if (mode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to={`/model/${modelName}/data`}
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Data
          </Link>
          <div className="flex gap-2">
            <Link
              to={showPath}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <Eye className="w-4 h-4" />
              View
            </Link>
            <button
              onClick={() => setDeleting(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <EditRecordModal
          model={model}
          schema={schema!}
          record={record}
          onSave={(payload) => updateMutation.mutate(payload)}
          onCancel={() => navigate(showPath)}
          inline
        />

        {deleting && (
          <ConfirmDeleteModal
            title={`Delete ${modelName} #${id}?`}
            onConfirm={() => deleteMutation.mutate()}
            onCancel={() => setDeleting(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/model/${modelName}/data`}
          className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Data
        </Link>
        <div className="flex gap-2">
          <Link
            to={editPath}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => setDeleting(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-600">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {modelName} #{record.id}
          </h2>
        </div>
        <dl className="divide-y divide-slate-200 dark:divide-slate-600">
          {scalarFields.map((f) => (
            <div key={f.name} className="px-6 py-4 flex gap-4">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 w-40 shrink-0">
                {f.name}
              </dt>
              <dd className="text-sm text-slate-900 dark:text-slate-100">
                {formatValue(record[f.name])}
              </dd>
            </div>
          ))}
          {relationFields.map((f) => {
            const val = record[f.name]
            const targetModel = getRelationTargetModel(f)
            const isArray = f.type.includes('[]')
            const relId =
              val && typeof val === 'object' && !Array.isArray(val) && 'id' in (val as object)
                ? (val as { id: number }).id
                : null
            const display = formatValue(val)

            return (
              <div key={f.name} className="px-6 py-4 flex gap-4">
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 w-40 shrink-0">
                  {f.name}
                </dt>
                <dd className="text-sm">
                  {relId ? (
                    <Link
                      to={`/model/${targetModel}/record/${relId}`}
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {display}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : isArray && Array.isArray(val) && val.length > 0 && record.id != null ? (
                    <Link
                      to={`/model/${targetModel}/data?${modelName!.charAt(0).toLowerCase() + modelName!.slice(1)}Id=${record.id}`}
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {display}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">{display}</span>
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      {deleting && (
        <ConfirmDeleteModal
          title={`Delete ${modelName} #${id}?`}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  )
}
