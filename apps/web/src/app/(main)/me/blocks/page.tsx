'use client'

import { formatDateTime } from '@/common/format-date'
import { blockedUsersQueryKey, useBlockedUsers, useUnblockUser } from '@/features/block/block.hooks'
import { useQueryClient } from '@tanstack/react-query'

export default function BlockedUsersPage() {
  const { data: blockedUsers, isLoading } = useBlockedUsers()
  const queryClient = useQueryClient()
  const unblockUser = useUnblockUser({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: blockedUsersQueryKey })
  })

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-lg font-semibold'>Blocked users</h1>

      {isLoading && <p className='text-sm text-muted-foreground'>Loading...</p>}

      <ul className='flex flex-col gap-3'>
        {blockedUsers?.map((block) => (
          <li key={block.user.id} className='flex items-center justify-between gap-4 rounded-md border border-border p-3'>
            <div>
              <p className='text-sm font-medium'>{block.user.displayName ?? block.user.username ?? 'Deleted user'}</p>
              <p className='text-xs text-muted-foreground'>
                Blocked
                {' '}
                {formatDateTime(block.blockedAt)}
              </p>
            </div>

            <button
              type='button'
              disabled={unblockUser.isPending}
              onClick={() => unblockUser.mutate(block.user.id)}
              className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
            >
              Unblock
            </button>
          </li>
        ))}

        {blockedUsers?.length === 0 && (
          <p className='text-sm text-muted-foreground'>You haven&apos;t blocked anyone.</p>
        )}
      </ul>
    </div>
  )
}
