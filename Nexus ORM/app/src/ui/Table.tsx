import type { ReactNode } from 'react'

const containerClasses =
  'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden'

const theadRowClasses = 'bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600'
const thClasses = 'text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400'
const tbodyRowClasses =
  'border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30'
const tdClasses = 'px-6 py-3 text-sm text-slate-900 dark:text-slate-100'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`${containerClasses} ${className}`.trim()}>
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  )
}

Table.Thead = function TableThead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

Table.Tbody = function TableTbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

Table.HeadRow = function TableHeadRow({ children }: { children: ReactNode }) {
  return <tr className={theadRowClasses}>{children}</tr>
}

Table.HeadCell = function TableHeadCell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <th className={`${thClasses} ${className}`.trim()}>{children}</th>
}

Table.BodyRow = function TableBodyRow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <tr className={`${tbodyRowClasses} ${className}`.trim()}>{children}</tr>
}

Table.BodyCell = function TableBodyCell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <td className={`${tdClasses} ${className}`.trim()}>{children}</td>
}
