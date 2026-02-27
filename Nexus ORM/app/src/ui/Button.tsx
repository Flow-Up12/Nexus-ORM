import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
type ButtonSize = 'sm' | 'default'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
  ghost:
    'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed',
  icon:
    'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  default: 'px-4 py-2',
}

const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'default',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isIconOnly = variant === 'icon' && !children
  const classes = [
    baseClasses,
    variantClasses[variant],
    isIconOnly ? 'p-2' : sizeClasses[size],
  ].join(' ')

  return (
    <button
      type="button"
      className={`${classes} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
