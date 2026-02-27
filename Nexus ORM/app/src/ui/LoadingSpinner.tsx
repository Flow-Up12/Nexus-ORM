import { Loader2 } from 'lucide-react'

type Size = 'sm' | 'default'

const sizeClasses: Record<Size, string> = {
  sm: 'w-5 h-5',
  default: 'w-8 h-8',
}

interface LoadingSpinnerProps {
  size?: Size
  className?: string
  /** Optional className for the wrapper (e.g. h-96 for taller containers) */
  containerClassName?: string
}

export function LoadingSpinner({
  size = 'default',
  className = '',
  containerClassName = 'h-64',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${containerClassName}`.trim()}>
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-indigo-600 ${className}`.trim()}
      />
    </div>
  )
}
