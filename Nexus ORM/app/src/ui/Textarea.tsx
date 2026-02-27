import type { TextareaHTMLAttributes } from 'react'

const baseClasses =
  'w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string
  error?: string
  monospace?: boolean
  className?: string
}

export function Textarea({
  label,
  error,
  monospace = false,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? (label ? `textarea-${label.replace(/\s/g, '-').toLowerCase()}` : undefined)

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {label}
          {props.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`${baseClasses} ${monospace ? 'font-mono text-sm' : ''} ${error ? 'border-red-500 dark:border-red-500' : ''}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
