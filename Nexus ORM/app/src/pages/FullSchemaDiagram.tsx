import { useState } from 'react'
import { FullSchemaERDiagram } from '@/components/FullSchemaERDiagram'
import { MermaidERDiagram } from '@/components/MermaidERDiagram'
import { GitBranch, FileText } from 'lucide-react'
import { LoadingSpinner, ErrorMessage, PageHeader } from '@/ui'
import { useSchema } from '@/hooks'

export function FullSchemaDiagram() {
  const [view, setView] = useState<'interactive' | 'mermaid'>('interactive')
  const { schema: data, isLoading, error } = useSchema()

  if (isLoading) {
    return <LoadingSpinner containerClassName="h-96" />
  }

  if (error) {
    return (
      <ErrorMessage
        message={`Failed to load schema: ${error instanceof Error ? error.message : 'Unknown error'}`}
      />
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Full Schema ER Diagram"
          description={`Complete database schema with all ${data.parsed.models.length} models and relationships.`}
        />
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
