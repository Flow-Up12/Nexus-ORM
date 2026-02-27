import type { ReactNode } from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'

interface AsyncContentProps {
  isLoading: boolean
  error: unknown
  errorMessage?: string
  children: ReactNode
}

export function AsyncContent({
  isLoading,
  error,
  errorMessage,
  children,
}: AsyncContentProps) {
  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    const message =
      errorMessage ?? (error instanceof Error ? error.message : 'Something went wrong')
    return <ErrorMessage message={message} />
  }

  return <>{children}</>
}
