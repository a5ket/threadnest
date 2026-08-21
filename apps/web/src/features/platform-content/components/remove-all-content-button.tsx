'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { useState } from 'react'
import { useRemoveAllContentByUser } from '../platform-content.hooks'

interface RemoveAllContentButtonProps {
  userId: string
}

export function RemoveAllContentButton({ userId }: RemoveAllContentButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ threadsRemoved: number, commentsRemoved: number } | null>(null)

  const removeAll = useRemoveAllContentByUser({
    onSuccess: (data) => setResult(data),
    onError: (err) => {
      switch (err.errorCode) {
        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to remove this user\'s content.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <div className='flex flex-col gap-2'>
      <DeleteConfirmButton
        variant='platform'
        label='Remove all content'
        confirmLabel='Remove all'
        title={'Remove all of this user\'s content?'}
        description={'Permanently removes every thread and comment they\'ve posted, across every nest. This cannot be undone.'}
        isPending={removeAll.isPending}
        onConfirm={() => {
          setError(null)
          setResult(null)
          removeAll.mutate(userId)
        }}
      />

      {result && (
        <p className='text-xs text-muted-foreground'>
          {'Removed '}
          {result.threadsRemoved}
          {' threads and '}
          {result.commentsRemoved}
          {' comments.'}
        </p>
      )}

      {error && (
        <p role='alert' className='text-xs text-destructive'>{error}</p>
      )}
    </div>
  )
}
