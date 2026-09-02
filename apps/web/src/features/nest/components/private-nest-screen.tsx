'use client'

import { Badge } from '@/common/components/badge'
import { useCreateJoinRequest } from '@/features/join-request/join-request.hooks'
import { useIsSignedIn } from '@/features/me/me.hooks'
import { NestAccessContextDtoJoinPolicy } from '@/generated/api/models'
import { useState } from 'react'

interface PrivateNestScreenProps {
  nestSlug: string
  name: string
  joinPolicy: NestAccessContextDtoJoinPolicy
}

export function PrivateNestScreen({ nestSlug, name, joinPolicy }: PrivateNestScreenProps) {
  const isSignedIn = useIsSignedIn()
  const [message, setMessage] = useState<string | null>(null)

  const createJoinRequest = useCreateJoinRequest({
    onSuccess: () => setMessage('Request sent. A moderator will review it.'),
    onError: (error) => {
      switch (error.errorCode) {
        case 'ALREADY_HAS_PENDING_JOIN_REQUEST':
          setMessage('You already have a pending request to join.')
          break

        case 'ALREADY_A_MEMBER':
          setMessage('You\'re already a member of this nest.')
          break

        case 'ALREADY_INVITED':
          setMessage('You already have a pending invite to this nest — check your invites.')
          break

        case 'USER_BANNED':
          setMessage('You can\'t request to join this nest.')
          break

        case 'JOIN_REQUESTS_NOT_ACCEPTED':
          setMessage('This nest isn\'t accepting join requests right now.')
          break

        case 'NETWORK_ERROR':
          setMessage('Unable to connect. Check your internet connection.')
          break

        default:
          setMessage('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center'>
      <div className='flex items-center gap-2'>
        <h1 className='text-lg font-semibold'>{name}</h1>
        <Badge>Private</Badge>
      </div>

      <p className='max-w-sm text-sm text-muted-foreground'>
        This nest is private. You need to be a member to view its content.
      </p>

      {joinPolicy === NestAccessContextDtoJoinPolicy.BY_INVITE && (
        <p className='text-sm text-muted-foreground'>This nest is invite-only — ask a member to invite you.</p>
      )}

      {joinPolicy === NestAccessContextDtoJoinPolicy.BY_REQUEST && (
        isSignedIn
          ? (
              <>
                <button
                  type='button'
                  disabled={createJoinRequest.isPending || message !== null}
                  onClick={() => createJoinRequest.mutate(nestSlug)}
                  className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
                >
                  {createJoinRequest.isPending ? 'Requesting...' : 'Request to join'}
                </button>

                {message && (
                  <p className='text-sm text-muted-foreground'>{message}</p>
                )}
              </>
            )
          : (
              <p className='text-sm text-muted-foreground'>Sign in to request to join.</p>
            )
      )}
    </div>
  )
}
