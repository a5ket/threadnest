'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useRemoveThreadByPlatform } from '../platform-content.hooks'

interface RemoveThreadPlatformButtonProps {
  nestSlug: string
  threadId: string
}

export function RemoveThreadPlatformButton({ nestSlug, threadId }: RemoveThreadPlatformButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const removeThread = useRemoveThreadByPlatform({
    onSuccess: () => router.push(`/n/${nestSlug}`),
    onError: (err) => {
      switch (err.errorCode) {
        case 'THREAD_ALREADY_DELETED':
          setError('This thread was already removed.')
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to remove this thread.')
          break

        case 'THREAD_NOT_FOUND':
          setError('This thread no longer exists.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <span className='flex items-center gap-2'>
      <DeleteConfirmButton
        variant='platform'
        label='Remove (platform)'
        confirmLabel='Remove'
        title='Remove this thread under platform authority?'
        description='This bypasses nest moderation and permanently removes the thread and its comments. This cannot be undone.'
        isPending={removeThread.isPending}
        onConfirm={() => {
          setError(null)
          removeThread.mutate(threadId)
        }}
      />

      {error && (
        <span role='alert' className='text-xs text-destructive'>{error}</span>
      )}
    </span>
  )
}
