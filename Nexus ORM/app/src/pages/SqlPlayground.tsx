import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Play, FileJson, FileSpreadsheet, HelpCircle, Save, Plus, Trash2, FileDown, FileUp } from 'lucide-react'
import { Modal, Button, Input, Table } from '@/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { runSqlQuery, saveSqlScriptToServer, listSqlScripts, loadSqlScriptFromServer } from '@/api/query'
import { exportToCsv, exportToJson } from '@/utils/export'

const SAVED_QUERIES_KEY = 'ufo-sql-saved-queries'

interface SavedQuery {
  id: string
  name: string
  sql: string
  createdAt: number
}

function loadSavedQueries(): SavedQuery[] {
  try {
    const raw = localStorage.getItem(SAVED_QUERIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveQueriesToStorage(queries: SavedQuery[]) {
  localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries))
}

const DEFAULT_SQL = `-- Write your SQL query here
-- Example: SELECT * FROM customers LIMIT 10;
`

const HELP_CONTENT = {
  basics: [
    { title: 'SELECT', desc: 'Retrieve columns from a table', ex: 'SELECT id, name FROM customers;' },
    { title: 'WHERE', desc: 'Filter rows by condition', ex: 'SELECT * FROM orders WHERE "totalValue" > 100;' },
    { title: 'ORDER BY', desc: 'Sort results (ASC or DESC)', ex: 'SELECT * FROM customers ORDER BY name ASC;' },
    { title: 'LIMIT / OFFSET', desc: 'Restrict rows returned', ex: 'SELECT * FROM orders LIMIT 10 OFFSET 20;' },
  ],
  joins: [
    { title: 'INNER JOIN', desc: 'Rows matching in both tables', ex: 'SELECT c.name, o."totalValue" FROM customers c JOIN orders o ON o."customerId" = c.id;' },
    { title: 'LEFT JOIN', desc: 'All from left, matching from right', ex: 'SELECT c.name, COUNT(o.id) FROM customers c LEFT JOIN orders o ON o."customerId" = c.id GROUP BY c.id;' },
  ],
  aggregations: [
    { title: 'COUNT()', desc: 'Count rows', ex: 'SELECT COUNT(*) FROM customers;' },
    { title: 'SUM()', desc: 'Sum numeric values', ex: 'SELECT SUM("totalValue") FROM orders;' },
    { title: 'AVG()', desc: 'Average of values', ex: 'SELECT AVG("unitPrice") FROM order_lines;' },
    { title: 'MIN() / MAX()', desc: 'Smallest or largest value', ex: 'SELECT MIN("orderDate"), MAX("orderDate") FROM orders;' },
    { title: 'GROUP BY', desc: 'Group rows for aggregation', ex: 'SELECT "customerId", COUNT(*) FROM orders GROUP BY "customerId";' },
    { title: 'HAVING', desc: 'Filter grouped results', ex: 'SELECT "customerId", SUM("totalValue") FROM orders GROUP BY "customerId" HAVING SUM("totalValue") > 500;' },
  ],
  advanced: [
    { title: 'Subquery', desc: 'Query inside another', ex: 'SELECT * FROM customers WHERE id IN (SELECT "customerId" FROM orders);' },
    { title: 'CTE (WITH)', desc: 'Named temporary result set', ex: 'WITH top_orders AS (SELECT * FROM orders ORDER BY "totalValue" DESC LIMIT 5) SELECT * FROM top_orders;' },
    { title: 'CASE WHEN', desc: 'Conditional logic', ex: 'SELECT name, CASE WHEN "totalValue" > 1000 THEN \'High\' ELSE \'Low\' END FROM orders;' },
    { title: 'COALESCE', desc: 'First non-null value', ex: 'SELECT COALESCE(column, 0) FROM table;' },
    { title: 'String functions', desc: 'CONCAT, UPPER, LOWER, LENGTH, TRIM', ex: 'SELECT UPPER(name), LENGTH(name) FROM customers;' },
    { title: 'Date functions', desc: 'NOW(), DATE_TRUNC, EXTRACT', ex: 'SELECT DATE_TRUNC(\'month\', "orderDate") FROM orders;' },
  ],
  tables: [
    'customers', 'orders', 'order_lines', 'shipments', 'billing_addresses',
    'delivery_addresses', 'drivers', 'employees', 'furniture_types', 'sales_reps', 'trucks',
  ],
}

export function SqlPlayground() {
  const [sql, setSql] = useState(DEFAULT_SQL)
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(loadSavedQueries)
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveToServer, setSaveToServer] = useState(false)
  const [savingToServer, setSavingToServer] = useState(false)
  const [currentServerScript, setCurrentServerScript] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [exportFilename, setExportFilename] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    saveQueriesToStorage(savedQueries)
  }, [savedQueries])

  const currentQuery = savedQueries.find((q) => q.id === currentQueryId)

  const handleLoadQuery = (query: SavedQuery) => {
    setSql(query.sql)
    setCurrentQueryId(query.id)
    setSaveName(query.name)
    setCurrentServerScript(null)
  }

  const handleNewQuery = () => {
    setSql(DEFAULT_SQL)
    setCurrentQueryId(null)
    setSaveName('')
    setCurrentServerScript(null)
  }

  const handleSave = () => {
    if (saveToServer) {
      handleSaveToServer()
      return
    }
    const name = saveName.trim()
    if (!name) {
      toast.error('Please enter a name for the query')
      return
    }
    const trimmed = sql.trim()
    if (!trimmed) {
      toast.error('Please enter a SQL query to save')
      return
    }
    const now = Date.now()
    if (currentQueryId) {
      setSavedQueries((prev) =>
        prev.map((q) =>
          q.id === currentQueryId ? { ...q, name, sql: trimmed, createdAt: now } : q
        )
      )
      toast.success('Query updated')
    } else {
      const newQuery: SavedQuery = {
        id: `q-${now}`,
        name,
        sql: trimmed,
        createdAt: now,
      }
      setSavedQueries((prev) => [...prev, newQuery].sort((a, b) => b.createdAt - a.createdAt))
      setCurrentQueryId(newQuery.id)
      toast.success('Query saved')
    }
    setShowSaveModal(false)
  }

  const handleDeleteQuery = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSavedQueries((prev) => prev.filter((q) => q.id !== id))
    if (currentQueryId === id) {
      handleNewQuery()
    }
    toast.success('Query deleted')
  }

  const openSaveModal = (toServer = false) => {
    setSaveName(currentQuery?.name ?? '')
    setSaveToServer(toServer)
    setShowSaveModal(true)
  }

  const handleSaveToServer = async () => {
    const name = saveName.trim()
    if (!name) {
      toast.error('Please enter a name for the script')
      return
    }
    const trimmed = sql.trim()
    if (!trimmed) {
      toast.error('Please enter a SQL query to save')
      return
    }
    setSavingToServer(true)
    try {
      await saveSqlScriptToServer(name, trimmed)
      toast.success(`Saved to server as ${name}.sql`)
      setShowSaveModal(false)
      queryClient.invalidateQueries({ queryKey: ['sql-scripts'] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSavingToServer(false)
    }
  }

  const { data: serverScripts = [] } = useQuery({
    queryKey: ['sql-scripts'],
    queryFn: listSqlScripts,
    refetchOnWindowFocus: false,
  })

  const handleLoadFromServer = async (filename: string) => {
    try {
      const { sql, name } = await loadSqlScriptFromServer(filename)
      setSql(sql)
      setCurrentQueryId(null)
      setSaveName(name)
      setCurrentServerScript(filename)
      toast.success(`Loaded ${filename}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load')
    }
  }

  const handleLoadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      if (content) {
        setSql(content)
        setCurrentQueryId(null)
        setSaveName(file.name.replace(/\.sql$/i, ''))
        setCurrentServerScript(null)
        toast.success(`Loaded ${file.name}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const runMutation = useMutation({
    mutationFn: runSqlQuery,
    onSuccess: (res) => {
      const data = res.data
      if (Array.isArray(data)) {
        setResults(data as Record<string, unknown>[])
        toast.success(`Query returned ${data.length} row(s)`)
      } else {
        setResults(data != null ? [data as Record<string, unknown>] : [])
        toast.success('Query executed successfully')
      }
    },
    onError: (e) => {
      setResults(null)
      toast.error(e instanceof Error ? e.message : 'Query failed')
    },
  })

  const handleRun = () => {
    const trimmed = sql.trim()
    if (!trimmed) {
      toast.error('Please enter a SQL query')
      return
    }
    runMutation.mutate(trimmed)
  }

  const openExportModal = (format: 'csv' | 'json') => {
    if (!results || results.length === 0) {
      toast.error('No data to export')
      return
    }
    const base = currentServerScript?.replace(/\.sql$/i, '') || currentQuery?.name || saveName.trim() || 'query-results'
    setExportFormat(format)
    setExportFilename(base)
    setShowExportModal(true)
  }

  const handleExportConfirm = () => {
    if (!results || results.length === 0) return
    const name = exportFilename.trim().replace(/[^a-zA-Z0-9_.-]/g, '_') || 'export'
    const filename = name.endsWith(`.${exportFormat}`) ? name : `${name}.${exportFormat}`
    if (exportFormat === 'csv') {
      exportToCsv(results, filename)
      toast.success('Exported as CSV')
    } else {
      exportToJson(results, filename)
      toast.success('Exported as JSON')
    }
    setShowExportModal(false)
  }

  const columns = results && results.length > 0 ? Object.keys(results[0]) : []

  const formatCellValue = (val: unknown): string => {
    if (val == null) return '—'
    if (typeof val === 'object') {
      const o = val as Record<string, unknown>
      if (typeof o.toNumber === 'function') return String((o as { toNumber: () => number }).toNumber())
      if (typeof o.valueOf === 'function') return String((o as { valueOf: () => unknown }).valueOf())
      if (typeof o.toString === 'function') {
        const s = (o as { toString: () => string }).toString()
        if (s !== '[object Object]') return s
      }
      return JSON.stringify(val)
    }
    return String(val)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            SQL Playground
          </h2>
          <Button
            variant="icon"
            onClick={() => setShowHelpModal(true)}
            title="SQL help & common functions"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Run raw SQL queries against your database
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-600 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 shrink-0">
              Query
            </span>
            <select
              value={currentQueryId ?? ''}
              onChange={(e) => {
                const id = e.target.value
                if (!id) {
                  handleNewQuery()
                  return
                }
                const q = savedQueries.find((x) => x.id === id)
                if (q) handleLoadQuery(q)
              }}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-0 max-w-[200px]"
            >
              <option value="">New query</option>
              {savedQueries.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
            {serverScripts.length > 0 && (
              <select
                value={currentServerScript ?? ''}
                onChange={(e) => {
                  const fn = e.target.value
                  if (fn) handleLoadFromServer(fn)
                  else {
                    setCurrentServerScript(null)
                    setSql(DEFAULT_SQL)
                  }
                }}
                className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-0 max-w-[180px]"
                title="Load from server"
              >
                <option value="">Load from server...</option>
                {serverScripts.map((s) => (
                  <option key={s.filename} value={s.filename}>
                    {s.filename}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewQuery}
              title="New query"
            >
              <Plus className="w-4 h-4" />
              New
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openSaveModal(false)}
              title={currentQueryId ? 'Update saved query' : 'Save query (browser)'}
            >
              <Save className="w-4 h-4" />
              {currentQueryId ? 'Update' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openSaveModal(true)}
              title="Save as .sql file on server"
            >
              <FileDown className="w-4 h-4" />
              Save as .sql
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,text/plain"
              onChange={handleLoadFromFile}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="Load from .sql file"
            >
              <FileUp className="w-4 h-4" />
              Load file
            </Button>
            {currentQueryId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteQuery(currentQueryId, e)}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete saved query"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="SELECT * FROM ..."
          className="w-full h-48 p-4 font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-0 focus:ring-0 resize-y min-h-[12rem]"
          spellCheck={false}
        />
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle className="w-4 h-4" />
            SQL Help
          </Button>
          <Button
            variant="primary"
            onClick={handleRun}
            disabled={runMutation.isPending}
          >
            {runMutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Query
          </Button>
        </div>
      </div>

      {results !== null && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Results ({results.length} row{results.length !== 1 ? 's' : ''})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openExportModal('csv')}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openExportModal('json')}
              >
                <FileJson className="w-4 h-4" />
                Export JSON
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No rows returned
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700/50">
                  <Table.HeadRow>
                    {columns.map((col) => (
                      <Table.HeadCell key={col} className="whitespace-nowrap">
                        {col}
                      </Table.HeadCell>
                    ))}
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <Table.BodyRow key={i}>
                      {columns.map((col) => (
                        <Table.BodyCell key={col}>
                          {formatCellValue(row[col])}
                        </Table.BodyCell>
                      ))}
                    </Table.BodyRow>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showHelpModal && (
        <Modal
          open
          onClose={() => setShowHelpModal(false)}
          title="SQL Reference — Common Functions & Query Patterns"
          maxWidth="2xl"
        >
          <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Available tables</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">PostgreSQL: use lowercase. Quote mixed-case columns (e.g. "customerId")</p>
                <div className="flex flex-wrap gap-2">
                  {HELP_CONTENT.tables.map((t) => (
                    <code key={t} className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded">{t}</code>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Basics</h4>
                <div className="space-y-2">
                  {HELP_CONTENT.basics.map(({ title, desc, ex }) => (
                    <div key={title} className="text-sm">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{title}</span>
                      <span className="text-slate-600 dark:text-slate-400"> — {desc}</span>
                      <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs overflow-x-auto">{ex}</pre>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Joins</h4>
                <div className="space-y-2">
                  {HELP_CONTENT.joins.map(({ title, desc, ex }) => (
                    <div key={title} className="text-sm">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{title}</span>
                      <span className="text-slate-600 dark:text-slate-400"> — {desc}</span>
                      <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs overflow-x-auto">{ex}</pre>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Aggregations</h4>
                <div className="space-y-2">
                  {HELP_CONTENT.aggregations.map(({ title, desc, ex }) => (
                    <div key={title} className="text-sm">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{title}</span>
                      <span className="text-slate-600 dark:text-slate-400"> — {desc}</span>
                      <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs overflow-x-auto">{ex}</pre>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Advanced</h4>
                <div className="space-y-2">
                  {HELP_CONTENT.advanced.map(({ title, desc, ex }) => (
                    <div key={title} className="text-sm">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{title}</span>
                      <span className="text-slate-600 dark:text-slate-400"> — {desc}</span>
                      <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs overflow-x-auto">{ex}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </Modal>
      )}

      {showSaveModal && (
        <Modal
          open
          onClose={() => setShowSaveModal(false)}
          title={saveToServer ? 'Save as .sql on server' : currentQueryId ? 'Update query' : 'Save query'}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={savingToServer}>
                {savingToServer ? 'Saving...' : saveToServer ? 'Save to server' : (currentQueryId ? 'Update' : 'Save')}
              </Button>
            </div>
          }
        >
          {saveToServer && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Saves to <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">sql-scripts/</code> folder on the server
            </p>
          )}
          <Input
            label={saveToServer ? 'Script name' : 'Query name'}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="e.g. Top customers by spend"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </Modal>
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
