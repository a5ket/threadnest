'use client'

import { Avatar } from '@/common/components/avatar'
import { UserSearchInput } from '@/common/components/user-search-input'
import { useBanUser } from '@/features/nest-ban/nest-ban.hooks'
import type { NestBan } from '@/features/nest-ban/nest-ban.types'
import type { UserSearchResult } from '@/features/user/user.types'
import { useState } from 'react'

interface BanUserFormProps {
  nestSlug: string
  onBanned: (ban: NestBan) => void
}

export function BanUserForm({ nestSlug, onBanned }: BanUserFormProps) {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const banUser = useBanUser({
    onSuccess: (ban) => {
      setSelectedUser(null)
      setError(null)
      onBanned(ban)
    },
    onError: (err) => {
      switch (err.errorCode) {
        case 'CANNOT_BAN_YOURSELF':
          setError('You can\'t ban yourself')
          break

        case 'ALREADY_BANNED':
          setError('This user is already banned')
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to ban users')
          break

        case 'NETWORK_ERROR':
          setError('Unable to connect. Check your internet connection.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    banUser.mutate({ nestSlug, userId: selectedUser.id })
  }

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        {selectedUser
          ? (
              <div className='flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm'>
                <Avatar avatarUrl={selectedUser.avatarUrl} label={selectedUser.displayName ?? selectedUser.username ?? '?'} size={20} />
                <span className='flex-1 font-medium'>{selectedUser.displayName ?? selectedUser.username}</span>
                <button
                  type='button'
                  onClick={() => setSelectedUser(null)}
                  aria-label='Clear selection'
                  className='text-muted-foreground hover:text-foreground'
                >
                  <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-4 w-4'>
                    <path d='M5 5l10 10M15 5l-10 10' strokeLinecap='round' />
                  </svg>
                </button>
              </div>
            )
          : (
              <div className='flex-1'>
                <UserSearchInput
                  placeholder='Search by username...'
                  onSelect={(user) => {
                    setSelectedUser(user)
                    setError(null)
                  }}
                />
              </div>
            )}

        <button
          type='submit'
          disabled={!selectedUser || banUser.isPending}
          className='rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50'
        >
          {banUser.isPending ? 'Banning...' : 'Ban'}
        </button>
      </div>

      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      )}
    </form>
  )
}
