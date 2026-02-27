import { Link, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

function toModelLabel(fkParam: string): string {
  // orderId -> Order, customerId -> Customer
  const base = fkParam.replace(/Id$/, '')
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export function ModelBreadcrumb() {
  const { modelName } = useParams<{ modelName: string; id: string }>()
  const [searchParams] = useSearchParams()
  const { pathname } = useLocation()

  const segments: { label: string; href?: string }[] = [{ label: 'Dashboard', href: '/' }]

  if (!modelName) {
    return (
      <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Dashboard
        </Link>
      </nav>
    )
  }

  segments.push({
    label: modelName,
    href: `/model/${modelName}/data`,
  })

  // Check if we're on a record page
  const recordMatch = pathname.match(/\/record\/(\d+)(?:\/(show|edit))?$/)
  if (recordMatch) {
    const recordId = recordMatch[1]
    const subPath = recordMatch[2]
    segments.push({ label: `Record #${recordId}`, href: `/model/${modelName}/record/${recordId}/show` })
    if (subPath === 'edit') {
      segments.push({ label: 'Edit' })
    } else if (subPath === 'show') {
      segments.push({ label: 'View' })
    }
  } else {
    // Tab: data, structure, relationships, diagram
    const tabMatch = pathname.match(/\/(data|structure|relationships|diagram)$/)
    const tab = tabMatch ? tabMatch[1] : 'data'
    const tabLabels: Record<string, string> = {
      data: 'Data',
      structure: 'Structure',
      relationships: 'Relationships',
      diagram: 'Diagram',
    }
    segments.push({ label: tabLabels[tab] || tab })

    // Add filter context for data tab
    if (tab === 'data') {
      const filterKeys = ['page', 'pageSize', 'sortBy', 'sortOrder']
      const fkParams = [...searchParams.entries()].filter(
        ([k]) => !filterKeys.includes(k) && k.endsWith('Id')
      )
      if (fkParams.length > 0) {
        const filterParts = fkParams.map(([k, v]) => `${toModelLabel(k)} #${v}`)
        segments.push({ label: `Filter: ${filterParts.join(', ')}` })
      }
    }
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400" aria-label="Breadcrumb">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
          {seg.href ? (
            <Link
              to={seg.href}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[120px] sm:max-w-[200px]"
            >
              {seg.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[120px] sm:max-w-[200px]">
              {seg.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
