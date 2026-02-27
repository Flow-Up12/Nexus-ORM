import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSchema } from '@/api/schema'
import { FullSchemaERDiagram } from '@/components/FullSchemaERDiagram'
import { MermaidERDiagram } from '@/components/MermaidERDiagram'
import { Loader2, GitBranch, FileText } from 'lucide-react'

export function FullSchemaDiagram() {
  const [view, setView] = useState<'interactive' | 'mermaid'>('interactive')
  const { data, isLoading, error } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Failed to load schema: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Full Schema ER Diagram</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Complete database schema with all {data.parsed.models.length} models and relationships.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">View:</span>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-1">
            <button
              onClick={() => setView('interactive')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                view === 'interactive'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Interactive
            </button>
            <button
              onClick={() => setView('mermaid')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                view === 'mermaid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Static (Mermaid)
            </button>
          </div>
        </div>
      </div>
      {view === 'interactive' ? (
        <FullSchemaERDiagram schema={data} height="calc(100vh - 220px)" />
      ) : (
        <MermaidERDiagram schema={data} height="calc(100vh - 220px)" />
      )}
    </div>
  )
}
