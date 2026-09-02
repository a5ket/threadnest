'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { formatDateTime } from '@/common/format-date'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUnbanUser } from '../nest-ban.hooks'
import type { NestBan } from '../nest-ban.types'

interface BanItemProps {
  nestSlug: string
  ban: NestBan
}

export function BanItem({ nestSlug, ban }: BanItemProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const unbanUser = useUnbanUser({
    onSuccess: () => router.refresh(),
    onError: (err) => {
      switch (err.errorCode) {
        case 'CANNOT_UNBAN_YOURSELF':
          setError('You can\'t unban yourself.')
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to unban this user.')
          break

        case 'BAN_NOT_FOUND':
          setError('This user is no longer banned.')
          router.refresh()
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <li className='flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3'>
      <div>
        <p className='text-sm font-medium'>
          {ban.user.displayName ?? ban.user.username ?? 'Deleted user'}
        </p>

        <p className='text-xs text-muted-foreground'>
          {'Banned by '}
          {ban.bannedBy.displayName ?? ban.bannedBy.username ?? 'Deleted user'}
          {' · '}
          {formatDateTime(ban.bannedAt)}
        </p>

        {ban.reason && (
          <p className='text-xs text-muted-foreground'>
            {'Reason: '}
            {ban.reason}
          </p>
        )}

        {error && (
          <p role='alert' className='mt-1 text-xs text-destructive'>
            {error}
          </p>
        )}
      </div>

      <DeleteConfirmButton
        variant='moderator'
        label='Unban'
        confirmLabel='Unban'
        title={`Unban ${ban.user.displayName ?? ban.user.username ?? 'this user'}?`}
        description={'They\'ll be able to view and interact with this nest again.'}
        isPending={unbanUser.isPending}
        onConfirm={() => {
          setError(null)
          unbanUser.mutate({ nestSlug, userId: ban.user.id })
        }}
      />
    </li>
  )
}
