type BadgeVariant =
  | 'string'
  | 'stringarray'
  | 'int'
  | 'intarray'
  | 'float'
  | 'boolean'
  | 'datetime'
  | 'json'
  | 'array'
  | 'relation'
  | 'enum'
  | 'enumarray'

const variantClasses: Record<BadgeVariant, string> = {
  string: 'bg-emerald-500 text-white',
  stringarray: 'bg-emerald-600 text-white',
  int: 'bg-red-500 text-white',
  intarray: 'bg-red-600 text-white',
  float: 'bg-amber-500 text-white',
  boolean: 'bg-violet-500 text-white',
  datetime: 'bg-pink-500 text-white',
  json: 'bg-cyan-500 text-white',
  array: 'bg-cyan-600 text-white',
  relation: 'bg-indigo-500 text-white',
  enum: 'bg-violet-500 text-white',
  enumarray: 'bg-violet-600 text-white',
}

interface BadgeProps {
  variant: BadgeVariant
  children?: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${variantClasses[variant]} ${className}`.trim()}
    >
      {children ?? variant}
    </span>
  )
}
