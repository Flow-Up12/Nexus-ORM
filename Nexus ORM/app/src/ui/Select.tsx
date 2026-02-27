import type { SelectHTMLAttributes } from 'react'

const selectClasses =
  'w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string
  error?: string
  className?: string
}

export function Select({
  label,
  error,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? (label ? `select-${label.replace(/\s/g, '-').toLowerCase()}` : undefined)

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {label}
          {props.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`${selectClasses} ${error ? 'border-red-500 dark:border-red-500' : ''}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
