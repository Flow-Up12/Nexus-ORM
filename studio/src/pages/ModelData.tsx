import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useState, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  Columns3,
  ExternalLink,
} from 'lucide-react'
import { fetchSchema } from '@/api/schema'
import {
  fetchRecords,
  createRecord,
  deleteRecord,
  type RecordParams,
} from '@/api/records'
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

function formatRelationDisplay(
  rel: Record<string, unknown> | Record<string, unknown>[] | null,
  isArray: boolean
): string {
  if (rel == null) return '—'
  if (isArray && Array.isArray(rel)) {
    return rel.length ? `${rel.length} item(s)` : '—'
  }
  if (typeof rel === 'object' && !Array.isArray(rel)) {
    const r = rel as Record<string, unknown>
    const parts = ['street', 'city', 'state', 'zipCode', 'name', 'accountNumber']
      .filter((k) => r[k] != null && r[k] !== '')
      .map((k) => String(r[k]))
    if (parts.length) return parts.join(', ')
    if (r.id != null) return `#${r.id}`
  }
  return '—'
}

export function ModelData() {
  const { modelName } = useParams<{ modelName: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [deletingRecord, setDeletingRecord] = useState<Record<string, unknown> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set())
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [searchParams] = useSearchParams()
  const columnPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showColumnPicker && columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showColumnPicker])

  const { data: schema } = useQuery({ queryKey: ['schema'], queryFn: fetchSchema })
  const model = schema?.parsed?.models?.find((m) => m.name === modelName)

  const urlFilters = useMemo(() => {
    const f: Record<string, string> = {}
    const validFilterKeys = new Set(model?.fields?.map((x) => x.name) ?? [])
    searchParams.forEach((v, k) => {
      if (
        k !== 'page' &&
        k !== 'pageSize' &&
        k !== 'sortBy' &&
        k !== 'sortOrder' &&
        validFilterKeys.has(k)
      )
        f[k] = v
    })
    return f
  }, [searchParams, model])

  const allFields = useMemo(() => {
    if (!model?.fields) return []
    return model.fields.filter(
      (f) =>
        !f.type.includes('@updatedAt') &&
        !(f.name.endsWith('Id') && model.fields?.some((o) => o.name === f.name.replace(/Id$/, '')))
    )
  }, [model])

  const relationFields = useMemo(
    () => allFields.filter((f) => isRelationField(f, schema!)),
    [allFields, schema]
  )
  const populateStr = relationFields.map((f) => f.name).join(',')

  const params: RecordParams = {
    page,
    pageSize,
    ...(sortBy && { sortBy, sortOrder }),
    ...(populateStr && { populate: populateStr }),
    ...urlFilters,
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['records', modelName, page, pageSize, sortBy, sortOrder, populateStr, urlFilters],
    queryFn: () => fetchRecords(modelName!, params),
    enabled: !!modelName,
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createRecord(modelName!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', modelName] })
      toast.success('Record created')
      setIsCreating(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Create failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRecord(modelName!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', modelName] })
      toast.success('Record deleted')
      setDeletingRecord(null)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
  })

  const displayFields = useMemo(() => {
    const visible = visibleColumns.size > 0 ? visibleColumns : new Set(allFields.map((f) => f.name))
    return allFields.filter((f) => visible.has(f.name))
  }, [allFields, visibleColumns])

  const filteredRecords = useMemo(() => {
    const records = (data?.data ?? []) as Record<string, unknown>[]
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter((r) =>
      Object.values(r).some(
        (v) => v != null && String(v).toLowerCase().includes(q)
      )
    )
  }, [data?.data, search])

  const toggleColumn = (name: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next.size ? next : new Set(allFields.map((f) => f.name))
    })
  }

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (!modelName || !model) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
        Failed to load data
      </div>
    )
  }

  const meta = data?.meta?.pagination
  const pageCount = meta?.pageCount ?? 1
  const total = meta?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-slate-600 dark:text-slate-400">{total} records</p>
          {Object.keys(urlFilters).length > 0 && (
            <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded">
              Filtered
            </span>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 w-56"
            />
          </div>
          <div className="relative" ref={columnPickerRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowColumnPicker(!showColumnPicker)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Columns3 className="w-4 h-4" />
              Columns
            </button>
            {showColumnPicker && (
              <div className="absolute left-0 top-full mt-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 min-w-[180px]">
                {allFields.map((f) => (
                  <label
                    key={f.name}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        visibleColumns.size === 0 || visibleColumns.has(f.name)
                      }
                      onChange={() => toggleColumn(f.name)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{f.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          New Record
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                {displayFields.map((f) => {
                  const isRelation = isRelationField(f, schema!)
                  return (
                    <th
                      key={f.name}
                      className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400"
                    >
                      <button
                        type="button"
                        onClick={() => !isRelation && handleSort(f.name)}
                        className={`flex items-center gap-1 ${!isRelation ? 'hover:text-indigo-600 dark:hover:text-indigo-400' : ''}`}
                      >
                          {f.name}
                          {!isRelation && sortBy === f.name && (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          )}
                      </button>
                    </th>
                  )
                })}
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record: Record<string, unknown>) => (
                <tr
                  key={String(record.id)}
                  onClick={() => {
                    if (record.id != null) {
                      navigate(`/model/${modelName}/record/${record.id}`)
                    }
                  }}
                  className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer"
                >
                  {displayFields.map((f) => {
                    const isRelation = isRelationField(f, schema!)
                    const isArray = f.type.includes('[]')
                    const targetModel = isRelation ? getRelationTargetModel(f) : null
                    const val = record[f.name]

                    if (isRelation && targetModel) {
                      const display = formatRelationDisplay(
                        val as Record<string, unknown> | Record<string, unknown>[] | null,
                        isArray
                      )
                      const relId =
                        val && typeof val === 'object' && !Array.isArray(val) && 'id' in (val as object)
                          ? (val as { id: number }).id
                          : null
                      const prismaModelName =
                        modelName!.charAt(0).toLowerCase() + modelName!.slice(1)
                      const fkOnTarget = `${prismaModelName}Id`
                      const linkTo =
                        !isArray && relId
                          ? `/model/${targetModel}/record/${relId}`
                          : record.id != null
                            ? `/model/${targetModel}/data?${fkOnTarget}=${record.id}`
                            : `/model/${targetModel}/data`
                      const canLink = relId || (isArray && (val as unknown[])?.length)
                      return (
                        <td key={f.name} className="px-6 py-4 text-sm">
                          {canLink ? (
                            <Link
                              to={linkTo}
                              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {display}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">{display}</span>
                          )}
                        </td>
                      )
                    }

                    return (
                      <td
                        key={f.name}
                        className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100"
                      >
                        {record[f.name] != null ? String(record[f.name]) : '—'}
                      </td>
                    )
                  })}
                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      to={`/model/${modelName}/record/${record.id}`}
                      className="inline-flex p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeletingRecord(record as Record<string, unknown>)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-600">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex gap-1 p-2 rounded disabled:opacity-50 text-slate-600 dark:text-slate-400"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {page} of {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="inline-flex gap-1 p-2 rounded disabled:opacity-50 text-slate-600 dark:text-slate-400"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <EditRecordModal
          model={model}
          schema={schema!}
          record={{}}
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {deletingRecord && (
        <ConfirmDeleteModal
          title={`Delete ${modelName} #${deletingRecord.id}`}
          onConfirm={() => deleteMutation.mutate(deletingRecord.id as number)}
          onCancel={() => setDeletingRecord(null)}
        />
      )}
    </div>
  )
}
