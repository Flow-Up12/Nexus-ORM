import { BackLink } from './BackLink'

interface PageHeaderProps {
  title: string
  description?: string
  backTo?: string
  backLabel?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  backTo,
  backLabel = 'Back',
  className = '',
}: PageHeaderProps) {
  return (
    <div className={className}>
      {backTo && (
        <div className="mb-4">
          <BackLink to={backTo}>{backLabel}</BackLink>
        </div>
      )}
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mt-1">{description}</p>
      )}
    </div>
  )
}
