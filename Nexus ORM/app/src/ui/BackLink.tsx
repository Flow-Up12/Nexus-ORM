import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

const linkClasses =
  'inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors'

interface BackLinkProps {
  to: string
  children?: ReactNode
  className?: string
}

export function BackLink({ to, children, className = '' }: BackLinkProps) {
  return (
    <Link to={to} className={`${linkClasses} ${className}`.trim()}>
      <ArrowLeft className="w-4 h-4 shrink-0" />
      {children}
    </Link>
  )
}
