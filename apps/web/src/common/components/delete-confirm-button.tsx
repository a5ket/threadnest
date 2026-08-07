'use client'

import { ConfirmDialog } from '@/common/components/confirm-dialog'
import { useState } from 'react'

interface DeleteConfirmButtonProps {
  onConfirm: () => void
  isPending: boolean
  title: string
  description: string
  label?: string
  confirmLabel?: string
}

export function DeleteConfirmButton({
  onConfirm,
  isPending,
  title,
  description,
  label = 'Delete',
  confirmLabel = 'Delete'
}: DeleteConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <button
        type='button'
        disabled={isPending}
        onClick={() => setConfirming(true)}
        className='text-sm text-destructive hover:underline disabled:opacity-50'
      >
        {isPending ? 'Working...' : label}
      </button>

      <ConfirmDialog
        open={confirming}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          onConfirm()
        }}
      />
    </>
  )
}
