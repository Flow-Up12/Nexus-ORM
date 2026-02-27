import { Trash2 } from 'lucide-react'
import { Modal, Button } from '@/ui'

interface ConfirmDeleteModalProps {
  title: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({ title, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <Modal
      open
      onClose={onCancel}
      title={
        <>
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          {title}
        </>
      }
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      }
    >
      <p className="text-slate-600 dark:text-slate-400">This action cannot be undone.</p>
    </Modal>
  )
}
