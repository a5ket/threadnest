'use client'

import { Avatar } from '@/common/components/avatar'
import { UserSearchInput } from '@/common/components/user-search-input'
import { useCreateInvite } from '@/features/invite/invite.hooks'
import type { Invite } from '@/features/invite/invite.types'
import type { UserSearchResult } from '@/features/user/user.types'
import { useState } from 'react'

interface CreateInviteFormProps {
  nestSlug: string
  onCreated: (invite: Invite) => void
}

export function CreateInviteForm({ nestSlug, onCreated }: CreateInviteFormProps) {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createInvite = useCreateInvite({
    onSuccess: (invite) => {
      setSelectedUser(null)
      setError(null)
      onCreated(invite)
    },
    onError: (err) => {
      switch (err.errorCode) {
        case 'USER_BANNED':
          setError('This user is banned from this nest')
          break

        case 'ALREADY_A_MEMBER':
          setError('This user is already a member')
          break

        case 'ALREADY_INVITED':
          setError('This user already has a pending invite')
          break

        case 'ALREADY_HAS_PENDING_JOIN_REQUEST':
          setError('This user already has a pending join request')
          break

        case 'INVITES_NOT_ALLOWED':
          setError('This user doesn\'t accept invites from this nest')
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to invite users')
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('Please verify your email to send invites')
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
    createInvite.mutate({ nestSlug, userId: selectedUser.id })
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
                  <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
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
          disabled={!selectedUser || createInvite.isPending}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {createInvite.isPending ? 'Inviting...' : 'Invite'}
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
