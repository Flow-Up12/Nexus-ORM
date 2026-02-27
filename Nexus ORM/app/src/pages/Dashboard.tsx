import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchSchema } from '@/api/schema'
import { Database, GitBranch, FileCode, Loader2, Table } from 'lucide-react'
import { Card } from '@/ui'

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
  })

  const models = data?.parsed?.models ?? []

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nexus ORM</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Universal Furniture Outlet - Database Manager</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/schema/overview"
          className="block p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500 transition-all group"
        >
          <GitBranch className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Full Schema ER Diagram</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View complete schema with Crow&apos;s Foot notation</p>
        </Link>
        <Link
          to="/schema/editor"
          className="block p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500 transition-all group"
        >
          <FileCode className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Schema Editor</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Edit Prisma schema</p>
        </Link>
        <Card>
          <Database className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-3" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Models</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{models.length} models in schema</p>
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-600">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Models</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Click to view structure</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {models.map((model) => (
            <Link
              key={model.name}
              to={`/model/${model.name}/data`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Table className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{model.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{model.fields?.length ?? 0} fields</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
