'use client'

import { useConfirmPasswordReset } from '@/features/auth/auth.hooks'
import { confirmPasswordResetSchema, type ConfirmPasswordResetFormValues } from '@/features/auth/auth.schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthField } from './auth-field'

interface ConfirmPasswordResetFormProps {
  token: string
}

export function ConfirmPasswordResetForm({ token }: ConfirmPasswordResetFormProps) {
  const [invalidLink, setInvalidLink] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<ConfirmPasswordResetFormValues>({
    resolver: zodResolver(confirmPasswordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  const confirmReset = useConfirmPasswordReset({
    onError: (error) => {
      switch (error.errorCode) {
        case 'SAME_PASSWORD':
          setError('password', { type: 'server', message: 'New password must be different from your current password' })
          break

        case 'TOKEN_NOT_FOUND':
        case 'TOKEN_EXPIRED':
        case 'TOKEN_SUPERSEDED':
        case 'TOKEN_ALREADY_REDEEMED':
          setInvalidLink(true)
          break

        case 'VALIDATION_FAILED':
          setError('root', { type: 'server', message: 'Please check the entered information' })
          break

        case 'NETWORK_ERROR':
          setError('root', { type: 'server', message: 'Unable to connect. Check your internet connection.' })
          break

        default:
          setError('root', { type: 'server', message: 'Something went wrong. Please try again.' })
      }
    }
  })

  const onSubmit = handleSubmit((values) => {
    confirmReset.mutate({ token, password: values.password })
  })

  const isPending = confirmReset.isPending || isSubmitting

  if (invalidLink) {
    return (
      <div className='flex flex-col items-center gap-3 text-center'>
        <p role='alert' className='text-sm text-destructive'>
          This link is invalid or has expired.
        </p>
        <Link href='/reset-password' className='text-sm font-medium text-primary hover:underline'>Request a new link</Link>
      </div>
    )
  }

  if (confirmReset.isSuccess) {
    return (
      <div className='flex flex-col items-center gap-3 text-center'>
        <p className='text-sm'>Your password has been reset.</p>
        <Link href='/login' className='text-sm font-medium text-primary hover:underline'>Log in</Link>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Set a new password</h1>
        <p className='text-sm text-muted-foreground'>Choose a new password for your account.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className='flex flex-col gap-4'>
        <AuthField
          id='password'
          label='New password'
          type='password'
          autoComplete='new-password'
          error={errors.password?.message}
          registration={register('password')}
        />

        <AuthField
          id='confirmPassword'
          label='Confirm new password'
          type='password'
          autoComplete='new-password'
          error={errors.confirmPassword?.message}
          registration={register('confirmPassword')}
        />

        {errors.root && (
          <p role='alert' className='text-sm text-destructive'>
            {errors.root.message}
          </p>
        )}

        <button
          type='submit'
          disabled={isPending}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isPending ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  )
}
