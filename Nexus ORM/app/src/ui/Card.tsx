import type { ReactNode } from 'react'

const cardClasses =
  'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`${cardClasses} ${padding ? 'p-6' : ''} ${className}`.trim()}>
      {children}
    </div>
  )
}
