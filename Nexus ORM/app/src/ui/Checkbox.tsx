import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: string
  className?: string
}

export function Checkbox({
  label,
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id ?? `checkbox-${label.replace(/\s/g, '-').toLowerCase()}`

  return (
    <label
      htmlFor={checkboxId}
      className={`flex items-center gap-2 cursor-pointer ${className}`.trim()}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
        {...props}
      />
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  )
}
