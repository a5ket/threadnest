'use client'

import { useBanUser } from '@/features/nest-ban/nest-ban.hooks'
import type { NestBan } from '@/features/nest-ban/nest-ban.types'
import { userGetByUsername } from '@/generated/api/users/users'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const banByUsernameSchema = z.object({
  username: z.string().min(1, 'Enter a username')
})

type BanByUsernameFormValues = z.infer<typeof banByUsernameSchema>

interface BanUserFormProps {
  nestSlug: string
  onBanned: (ban: NestBan) => void
}

export function BanUserForm({ nestSlug, onBanned }: BanUserFormProps) {
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
  } = useForm<BanByUsernameFormValues>({
    resolver: zodResolver(banByUsernameSchema),
    defaultValues: { username: '' }
  })

  const banUser = useBanUser({
    onSuccess: (ban) => {
      reset()
      onBanned(ban)
    },
    onError: (error) => {
      switch (error.errorCode) {
        case 'CANNOT_BAN_YOURSELF':
          setError('root', { type: 'server', message: 'You can\'t ban yourself' })
          break

        case 'ALREADY_BANNED':
          setError('root', { type: 'server', message: 'This user is already banned' })
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('root', { type: 'server', message: 'You don\'t have permission to ban users' })
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

      banUser.mutate({ nestSlug, userId: result.data.data.userId })
    }
    catch {
      setError('root', { type: 'server', message: 'Unable to connect. Check your internet connection.' })
    }
    finally {
      setIsLookingUp(false)
    }
  })

  const isPending = isLookingUp || banUser.isPending || isSubmitting

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
          className='rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50'
        >
          {isPending ? 'Banning...' : 'Ban'}
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
