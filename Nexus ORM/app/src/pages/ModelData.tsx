import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useState, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Columns3,
  ExternalLink,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react'
import { Button, SearchInput, Card, Modal, Input, LoadingSpinner, ErrorMessage, Table } from '@/ui'
import { useSchema, useMutationWithToast } from '@/hooks'
import {
  fetchRecords,
  createRecord,
  deleteRecord,
  type RecordParams,
} from '@/api/records'
import { EditRecordModal } from '@/components/modals/EditRecordModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'
import { exportToCsv, exportToJson } from '@/utils/export'
import { isRelationField, getRelationTargetModel, formatRelationDisplay } from '@/utils/schema'
import type { SchemaData } from '@/types/schema'

export function ModelData() {
  const { modelName } = useParams<{ modelName: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [deletingRecord, setDeletingRecord] = useState<Record<string, unknown> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set())
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [exportFilename, setExportFilename] = useState('')
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

  const { schema } = useSchema()
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

  const createMutation = useMutationWithToast({
    mutationFn: (data: Record<string, unknown>) => createRecord(modelName!, data),
    invalidateKeys: [['records', modelName!]],
    successMessage: 'Record created',
    errorMessage: 'Create failed',
    onSuccess: () => setIsCreating(false),
  })

  const deleteMutation = useMutationWithToast({
    mutationFn: (id: number) => deleteRecord(modelName!, id),
    invalidateKeys: [['records', modelName!]],
    successMessage: 'Record deleted',
    errorMessage: 'Delete failed',
    onSuccess: () => setDeletingRecord(null),
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

  const handleExportConfirm = () => {
    if (filteredRecords.length === 0) return
    const name = exportFilename.trim().replace(/[^a-zA-Z0-9_.-]/g, '_') || 'export'
    const filename = name.endsWith(`.${exportFormat}`) ? name : `${name}.${exportFormat}`
    if (exportFormat === 'csv') {
      exportToCsv(filteredRecords, filename)
      toast.success('Exported as CSV')
    } else {
      exportToJson(filteredRecords, filename)
      toast.success('Exported as JSON')
    }
    setShowExportModal(false)
  }

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
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message="Failed to load data" />
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
          <SearchInput
            placeholder="Filter records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <div className="flex items-center gap-2">
            <div className="relative" ref={columnPickerRef}>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowColumnPicker(!showColumnPicker)
                }}
              >
                <Columns3 className="w-4 h-4" />
                Columns
              </Button>
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (filteredRecords.length === 0) {
                  toast.error('No data to export')
                  return
                }
                setExportFormat('csv')
                setExportFilename(modelName || 'export')
                setShowExportModal(true)
              }}
              title="Export as CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (filteredRecords.length === 0) {
                  toast.error('No data to export')
                  return
                }
                setExportFormat('json')
                setExportFilename(modelName || 'export')
                setShowExportModal(true)
              }}
              title="Export as JSON"
            >
              <FileJson className="w-4 h-4" />
              Export JSON
            </Button>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4" />
          New Record
        </Button>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <Table.Thead>
          <Table.HeadRow>
            {displayFields.map((f) => {
              const isRelation = isRelationField(f, schema!)
              return (
                <Table.HeadCell key={f.name}>
                  <button
                    type="button"
                    onClick={() => !isRelation && handleSort(f.name)}
                    className={`flex items-center gap-1 ${!isRelation ? 'hover:text-indigo-600 dark:hover:text-indigo-400' : ''}`}
                  >
                    {f.name}
                    {!isRelation && sortBy === f.name &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      ))}
                  </button>
                </Table.HeadCell>
              )
            })}
            <Table.HeadCell className="text-right">
              Actions
            </Table.HeadCell>
          </Table.HeadRow>
        </Table.Thead>
        <Table.Tbody>
          {filteredRecords.map((record: Record<string, unknown>) => (
            <Table.BodyRow
              key={String(record.id)}
              className="cursor-pointer"
              onClick={() => {
                if (record.id != null) {
                  navigate(`/model/${modelName}/record/${record.id}`)
                }
              }}
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
                    <Table.BodyCell key={f.name}>
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
                    </Table.BodyCell>
                  )
                }

                return (
                  <Table.BodyCell key={f.name}>
                    {record[f.name] != null ? String(record[f.name]) : '—'}
                  </Table.BodyCell>
                )
              })}
              <Table.BodyCell
                className="text-right"
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
              </Table.BodyCell>
            </Table.BodyRow>
          ))}
        </Table.Tbody>
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
      </Card>

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

      {showExportModal && (
        <Modal
          open
          onClose={() => setShowExportModal(false)}
          title={`Export as ${exportFormat.toUpperCase()}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleExportConfirm}>
                Export
              </Button>
            </div>
          }
        >
          <Input
            label="Filename"
            value={exportFilename}
            onChange={(e) => setExportFilename(e.target.value)}
            placeholder="export"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleExportConfirm()}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            .{exportFormat} will be added automatically
          </p>
        </Modal>
      )}
    </div>
  )
}
