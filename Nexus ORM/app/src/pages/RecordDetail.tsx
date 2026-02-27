import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Pencil, Trash2, ExternalLink, Eye } from 'lucide-react'
import { Card, Button, BackLink, LoadingSpinner, ErrorMessage } from '@/ui'
import { useSchema, useMutationWithToast } from '@/hooks'
import { fetchRecord, updateRecord, deleteRecord } from '@/api/records'
import { EditRecordModal } from '@/components/modals/EditRecordModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'
import { isRelationField, getRelationTargetModel } from '@/utils/schema'
import type { ParsedModel, SchemaData } from '@/types/schema'

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
  const [deleting, setDeleting] = useState(false)

  const { schema } = useSchema()
  const model = schema?.parsed?.models?.find((m) => m.name === modelName)

  const relationFields = model?.fields?.filter((f) => isRelationField(f, schema!)) ?? []
  const populateStr = relationFields.map((f) => f.name).join(',')

  const { data, isLoading, error } = useQuery({
    queryKey: ['record', modelName, id, populateStr],
    queryFn: () => fetchRecord(modelName!, id!, populateStr || undefined),
    enabled: !!modelName && !!id,
  })

  const updateMutation = useMutationWithToast({
    mutationFn: (payload: Record<string, unknown>) =>
      updateRecord(modelName!, id!, payload),
    invalidateKeys: [
      ['record', modelName!, id!],
      ['records', modelName!],
    ],
    successMessage: 'Record updated',
    errorMessage: 'Update failed',
    onSuccess: () => navigate(`/model/${modelName}/record/${id}/show`),
  })

  const deleteMutation = useMutationWithToast({
    mutationFn: () => deleteRecord(modelName!, id!),
    invalidateKeys: [['records', modelName!]],
    successMessage: 'Record deleted',
    errorMessage: 'Delete failed',
    onSuccess: () => navigate(`/model/${modelName}/data`),
  })

  if (!modelName || !id || !model) return null

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink to={`/model/${modelName}/data`}>Back to Data</BackLink>
        <ErrorMessage message="Failed to load record" />
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
          <BackLink to={`/model/${modelName}/data`}>Back to Data</BackLink>
          <div className="flex gap-2">
            <Link to={showPath}>
              <Button variant="secondary">
                <Eye className="w-4 h-4" />
                View
              </Button>
            </Link>
            <Button
              variant="danger"
              onClick={() => setDeleting(true)}
              className="border border-red-200 dark:border-red-800"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
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
        <BackLink to={`/model/${modelName}/data`}>Back to Data</BackLink>
        <div className="flex gap-2">
          <Link to={editPath}>
            <Button variant="primary">
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            onClick={() => setDeleting(true)}
            className="border border-red-200 dark:border-red-800"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card padding={false} className="overflow-hidden">
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
      </Card>

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
