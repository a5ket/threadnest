'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { useState } from 'react'
import { useRemoveCommentByPlatform } from '../platform-content.hooks'

interface RemoveCommentPlatformButtonProps {
  commentId: string
  onRemoved: () => void
}

export function RemoveCommentPlatformButton({ commentId, onRemoved }: RemoveCommentPlatformButtonProps) {
  const [error, setError] = useState<string | null>(null)

  const removeComment = useRemoveCommentByPlatform({
    onSuccess: onRemoved,
    onError: (err) => {
      switch (err.errorCode) {
        case 'COMMENT_ALREADY_DELETED':
          setError('This comment was already removed.')
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to remove this comment.')
          break

        case 'COMMENT_NOT_FOUND':
          setError('This comment no longer exists.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <span className='flex items-center gap-2'>
      <DeleteConfirmButton
        label='Remove (platform)'
        confirmLabel='Remove'
        title='Remove this comment under platform authority?'
        description='This bypasses nest moderation and permanently removes the comment. This cannot be undone.'
        isPending={removeComment.isPending}
        onConfirm={() => {
          setError(null)
          removeComment.mutate(commentId)
        }}
      />

      {error && (
        <span role='alert' className='text-xs text-destructive'>{error}</span>
      )}
    </span>
  )
}
