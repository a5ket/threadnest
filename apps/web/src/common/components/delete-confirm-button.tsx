'use client'

import { useState } from 'react'

interface DeleteConfirmButtonProps {
  onConfirm: () => void
  isPending: boolean
  label?: string
}

export function DeleteConfirmButton({ onConfirm, isPending, label = 'Delete' }: DeleteConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className='flex items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>Are you sure?</span>

        <button
          type='button'
          onClick={onConfirm}
          disabled={isPending}
          className='font-medium text-destructive hover:underline disabled:opacity-50'
        >
          {isPending ? 'Deleting...' : 'Yes, delete'}
        </button>

        <button type='button' onClick={() => setConfirming(false)} className='text-muted-foreground hover:underline'>
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button type='button' onClick={() => setConfirming(true)} className='text-sm text-destructive hover:underline'>
      {label}
    </button>
  )
}
