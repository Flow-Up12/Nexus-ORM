import type { ReactNode } from 'react'

const errorClasses =
  'p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400'

interface ErrorMessageProps {
  message?: string
  children?: ReactNode
  className?: string
}

export function ErrorMessage({ message, children, className = '' }: ErrorMessageProps) {
  const content = children ?? message
  if (!content) return null

  return (
    <div className={`${errorClasses} ${className}`.trim()}>
      {content}
    </div>
  )
}
