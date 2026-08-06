'use client'

import { useCreateInvite } from '@/features/invite/invite.hooks'
import type { Invite } from '@/features/invite/invite.types'
import { userGetByUsername } from '@/generated/api/users/users'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const inviteByUsernameSchema = z.object({
  username: z.string().min(1, 'Enter a username')
})

type InviteByUsernameFormValues = z.infer<typeof inviteByUsernameSchema>

interface CreateInviteFormProps {
  nestSlug: string
  onCreated: (invite: Invite) => void
}

export function CreateInviteForm({ nestSlug, onCreated }: CreateInviteFormProps) {
  const [isLookingUp, setIsLookingUp] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<InviteByUsernameFormValues>({
    resolver: zodResolver(inviteByUsernameSchema),
    defaultValues: { username: '' }
  })

  const createInvite = useCreateInvite({
    onSuccess: (invite) => {
      reset()
      onCreated(invite)
    },
    onError: (error) => {
      switch (error.errorCode) {
        case 'USER_BANNED':
          setError('root', { type: 'server', message: 'This user is banned from this nest' })
          break

        case 'ALREADY_A_MEMBER':
          setError('root', { type: 'server', message: 'This user is already a member' })
          break

        case 'ALREADY_INVITED':
          setError('root', { type: 'server', message: 'This user already has a pending invite' })
          break

        case 'ALREADY_HAS_PENDING_JOIN_REQUEST':
          setError('root', { type: 'server', message: 'This user already has a pending join request' })
          break

        case 'INVITES_NOT_ALLOWED':
          setError('root', { type: 'server', message: 'This user doesn\'t accept invites from this nest' })
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('root', { type: 'server', message: 'You don\'t have permission to invite users' })
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('root', { type: 'server', message: 'Please verify your email to send invites' })
          break

        case 'NETWORK_ERROR':
          setError('root', { type: 'server', message: 'Unable to connect. Check your internet connection.' })
          break

        default:
          setError('root', { type: 'server', message: 'Something went wrong. Please try again.' })
      }
    }
  })

  const onSubmit = handleSubmit(async (values) => {
    setIsLookingUp(true)

    try {
      const result = await userGetByUsername(values.username)

      if (result.status !== 200) {
        setError('username', { type: 'server', message: 'No user found with that username' })
        return
      }

      createInvite.mutate({ nestSlug, userId: result.data.data.userId })
    }
    catch {
      setError('root', { type: 'server', message: 'Unable to connect. Check your internet connection.' })
    }
    finally {
      setIsLookingUp(false)
    }
  })

  const isPending = isLookingUp || createInvite.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <input
          type='text'
          placeholder='Username'
          autoComplete='off'
          aria-invalid={errors.username ? 'true' : 'false'}
          className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('username')}
        />

        <button
          type='submit'
          disabled={isPending}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isPending ? 'Inviting...' : 'Invite'}
        </button>
      </div>

      {errors.username && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.username.message}
        </p>
      )}

      {errors.root && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.root.message}
        </p>
      )}
    </form>
  )
}
