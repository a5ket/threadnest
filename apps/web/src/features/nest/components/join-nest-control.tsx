'use client'

import { useCreateJoinRequest } from '@/features/join-request/join-request.hooks'
import { useAddNest, useIsSignedIn } from '@/features/me/me.hooks'
import { useJoinNest } from '@/features/nest-member/nest-member.hooks'
import { NestAccessContextDtoJoinPolicy } from '@/generated/api/models'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface JoinNestControlProps {
  nestSlug: string
  nestName: string
  joinPolicy: NestAccessContextDtoJoinPolicy
}

export function JoinNestControl({ nestSlug, nestName, joinPolicy }: JoinNestControlProps) {
  const router = useRouter()
  const addNest = useAddNest()
  const isSignedIn = useIsSignedIn()
  const [message, setMessage] = useState<string | null>(null)

  const joinNest = useJoinNest({
    onSuccess: () => {
      addNest({ name: nestName, slug: nestSlug })
      router.refresh()
    },
    onError: (error) => {
      switch (error.errorCode) {
        case 'ALREADY_A_MEMBER':
          router.refresh()
          break

        case 'USER_BANNED':
          setMessage('You can\'t join this nest.')
          break

        case 'JOIN_NOT_OPEN':
          setMessage('This nest doesn\'t allow joining directly.')
          break

        case 'NETWORK_ERROR':
          setMessage('Unable to connect. Check your internet connection.')
          break

        default:
          setMessage('Something went wrong. Please try again.')
      }
    }
  })

  const createJoinRequest = useCreateJoinRequest({
    onSuccess: () => setMessage('Request sent. A moderator will review it.'),
    onError: (error) => {
      switch (error.errorCode) {
        case 'ALREADY_HAS_PENDING_JOIN_REQUEST':
          setMessage('You already have a pending request to join.')
          break

        case 'ALREADY_A_MEMBER':
          router.refresh()
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

  if (!isSignedIn) {
    return <p className='text-sm text-muted-foreground'>Sign in to join.</p>
  }

  if (joinPolicy === NestAccessContextDtoJoinPolicy.OPEN) {
    return (
      <div className='flex items-center gap-3'>
        <button
          type='button'
          disabled={joinNest.isPending}
          onClick={() => {
            setMessage(null)
            joinNest.mutate(nestSlug)
          }}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {joinNest.isPending ? 'Joining...' : 'Join'}
        </button>

        {message && <p className='text-sm text-muted-foreground'>{message}</p>}
      </div>
    )
  }

  if (joinPolicy === NestAccessContextDtoJoinPolicy.BY_REQUEST) {
    return (
      <div className='flex items-center gap-3'>
        <button
          type='button'
          disabled={createJoinRequest.isPending || message !== null}
          onClick={() => createJoinRequest.mutate(nestSlug)}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {createJoinRequest.isPending ? 'Requesting...' : 'Request to join'}
        </button>

        {message && <p className='text-sm text-muted-foreground'>{message}</p>}
      </div>
    )
  }

  return <p className='text-sm text-muted-foreground'>This nest is invite-only.</p>
}
