'use client'

import { blockedUsersQueryKey, useBlockUser, useIsBlocked, useUnblockUser } from '@/features/block/block.hooks'
import { useUser } from '@/features/me/me.hooks'
import { useQueryClient } from '@tanstack/react-query'

interface BlockButtonProps {
  userId: string
}

export function BlockButton({ userId }: BlockButtonProps) {
  const currentUser = useUser()
  const isBlocked = useIsBlocked(userId)
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: blockedUsersQueryKey })

  const blockUser = useBlockUser({ onSuccess: invalidate })
  const unblockUser = useUnblockUser({ onSuccess: invalidate })

  if (!currentUser || currentUser.id === userId) {
    return null
  }

  const isPending = blockUser.isPending || unblockUser.isPending

  if (isBlocked) {
    return (
      <button
        type='button'
        disabled={isPending}
        onClick={() => unblockUser.mutate(userId)}
        className='text-muted-foreground hover:underline disabled:opacity-50'
      >
        Unblock
      </button>
    )
  }

  return (
    <button
      type='button'
      disabled={isPending}
      onClick={() => blockUser.mutate(userId)}
      className='text-muted-foreground hover:underline disabled:opacity-50'
    >
      Block
    </button>
  )
}
