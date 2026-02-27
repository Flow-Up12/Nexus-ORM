import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Play, Database, History, ChevronDown, ChevronUp } from 'lucide-react'
import {
  fetchSchema,
  saveSchemaRaw,
  generateClient,
  runMigration,
  fetchMigrations,
} from '@/api/schema'

export function SchemaEditor() {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
  })
  const { data: migrationsData } = useQuery({
    queryKey: ['migrations'],
    queryFn: fetchMigrations,
  })
  const [rawContent, setRawContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrationName, setMigrationName] = useState('')
  const [output, setOutput] = useState<{ type: 'generate' | 'migrate'; stdout?: string; stderr?: string } | null>(null)
  const [migrationsExpanded, setMigrationsExpanded] = useState(false)
  const [expandedMigration, setExpandedMigration] = useState<string | null>(null)

  useEffect(() => {
    if (data?.raw) setRawContent(data.raw)
  }, [data?.raw])

  const content = rawContent || (data?.raw ?? '')

  const handleSave = async () => {
    setSaving(true)
    setOutput(null)
    try {
      await saveSchemaRaw(content)
      toast.success('Schema saved')
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setOutput(null)
    try {
      const result = await generateClient()
      setOutput({ type: 'generate', stdout: result.output, stderr: result.error })
      toast.success('Prisma client generated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generate failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleMigrate = async () => {
    if (!migrationName.trim()) {
      toast.error('Migration name is required')
      return
    }
    setMigrating(true)
    setOutput(null)
    try {
      const result = await runMigration(migrationName.trim())
      setOutput({ type: 'migrate', stdout: result.output, stderr: result.error })
      toast.success('Migration completed')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['migrations'] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Migration failed')
    } finally {
      setMigrating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
        Failed to load schema
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Schema Editor</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Edit Prisma schema and run migrations</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {generating ? 'Generating...' : 'Generate Client'}
        </button>
        <div className="inline-flex items-center gap-2">
          <input
            type="text"
            placeholder="Migration name"
            value={migrationName}
            onChange={(e) => setMigrationName(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm w-48 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={handleMigrate}
            disabled={migrating || !migrationName.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {migrating ? 'Migrating...' : 'Run Migration'}
          </button>
        </div>
      </div>

      {output && (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm overflow-auto max-h-40">
          {output.stdout && <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{output.stdout}</pre>}
          {output.stderr && <pre className="text-amber-700 dark:text-amber-400 whitespace-pre-wrap mt-2">{output.stderr}</pre>}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setMigrationsExpanded(!migrationsExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
        >
          <span className="flex items-center gap-2 font-medium">
            <History className="w-5 h-5 text-indigo-500" />
            Migration History ({migrationsData?.migrations?.length ?? 0})
          </span>
          {migrationsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {migrationsExpanded && (
          <div className="border-t border-slate-200 dark:border-slate-600 max-h-64 overflow-y-auto">
            {migrationsData?.migrations?.length ? (
              migrationsData.migrations.map((m) => (
                <div key={m.name} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <button
                    type="button"
                    onClick={() => setExpandedMigration(expandedMigration === m.name ? null : m.name)}
                    className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <span className="font-mono text-sm text-slate-800 dark:text-slate-200">{m.name}</span>
                    {expandedMigration === m.name ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedMigration === m.name && m.sql && (
                    <pre className="px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap border-t border-slate-100 dark:border-slate-700">
                      {m.sql}
                    </pre>
                  )}
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 text-center">No migrations yet</p>
            )}
          </div>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setRawContent(e.target.value)}
        className="w-full h-[calc(100vh-380px)] p-4 font-mono text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        spellCheck={false}
      />
    </div>
  )
}
