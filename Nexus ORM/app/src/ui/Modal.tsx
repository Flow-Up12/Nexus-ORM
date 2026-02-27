import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type MaxWidth = 'md' | 'lg' | 'xl' | '2xl'

const maxWidthClasses: Record<MaxWidth, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: MaxWidth
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-600 shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-600 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
