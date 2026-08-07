'use client'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
      onClick={onCancel}
    >
      <div
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='confirm-dialog-title'
        className='w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id='confirm-dialog-title' className='text-base font-semibold'>
          {title}
        </h2>

        <p className='mt-2 text-sm text-muted-foreground'>
          {description}
        </p>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'
          >
            {cancelLabel}
          </button>

          <button
            type='button'
            onClick={onConfirm}
            className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
