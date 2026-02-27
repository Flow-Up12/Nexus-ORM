import { Outlet, Link, useParams, useLocation } from 'react-router-dom'
import { Table, Database, GitBranch, LayoutGrid } from 'lucide-react'
import { ModelBreadcrumb } from '@/components/Breadcrumb'

const tabs = [
  { path: 'data', label: 'Data', icon: Database },
  { path: 'structure', label: 'Structure', icon: Table },
  { path: 'relationships', label: 'Relationships', icon: GitBranch },
  { path: 'diagram', label: 'Diagram', icon: LayoutGrid },
]

export function ModelLayout() {
  const { modelName } = useParams<{ modelName: string }>()
  const location = useLocation()
  const basePath = `/model/${modelName}`

  return (
    <div className="space-y-4">
      <ModelBreadcrumb />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{modelName}</h1>
        <div className="flex gap-2 mt-2 border-b border-slate-200 dark:border-slate-600">
          {tabs.map(({ path, label, icon: Icon }) => {
            const tabPath = `${basePath}/${path}`
            const isActive = location.pathname === tabPath
            return (
              <Link
                key={path}
                to={tabPath}
                className={`inline-flex items-center gap-2 px-4 py-2 -mb-px border-b-2 transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
