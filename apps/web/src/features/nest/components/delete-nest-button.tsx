'use client'

import { ConfirmDialog } from '@/common/components/confirm-dialog'
import { useRemoveNest } from '@/features/me/me.hooks'
import { useDeleteNest } from '@/features/nest/nest.hooks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteNestButtonProps {
  nestSlug: string
  nestName: string
}

export function DeleteNestButton({ nestSlug, nestName }: DeleteNestButtonProps) {
  const router = useRouter()
  const removeNest = useRemoveNest()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteNest = useDeleteNest({
    onSuccess: () => {
      removeNest(nestSlug)
      router.push('/')
      router.refresh()
    },
    onError: (err) => {
      switch (err.errorCode) {
        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to delete this nest.')
          break

        case 'NEST_NOT_FOUND':
          setError('This nest no longer exists.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <div className='flex flex-col items-start gap-2'>
      <button
        type='button'
        disabled={deleteNest.isPending}
        onClick={() => setConfirming(true)}
        className='rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50'
      >
        {deleteNest.isPending ? 'Deleting...' : 'Delete nest'}
      </button>

      {error && (
        <p role='alert' className='text-xs text-destructive'>
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirming}
        title={`Delete ${nestName}?`}
        description='This permanently deletes the nest, all its threads, comments, and membership data. This cannot be undone.'
        confirmLabel='Delete nest'
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          setError(null)
          deleteNest.mutate(nestSlug)
        }}
      />
    </div>
  )
}
