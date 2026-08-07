'use client'

import { useConfirmPasswordReset } from '@/features/auth/auth.hooks'
import { confirmPasswordResetSchema, type ConfirmPasswordResetFormValues } from '@/features/auth/auth.schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

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
        <Link href='/reset-password' className='text-sm text-primary hover:underline'>Request a new link</Link>
      </div>
    )
  }

  if (confirmReset.isSuccess) {
    return (
      <div className='flex flex-col items-center gap-3 text-center'>
        <p className='text-sm'>Your password has been reset.</p>
        <Link href='/login' className='text-sm text-primary hover:underline'>Log in</Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className='flex w-full max-w-sm flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='password' className='text-sm font-medium'>
          New password
        </label>

        <input
          id='password'
          type='password'
          autoComplete='new-password'
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('password')}
        />

        {errors.password && (
          <p id='password-error' role='alert' className='text-sm text-destructive'>
            {errors.password.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='confirmPassword' className='text-sm font-medium'>
          Confirm new password
        </label>

        <input
          id='confirmPassword'
          type='password'
          autoComplete='new-password'
          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('confirmPassword')}
        />

        {errors.confirmPassword && (
          <p id='confirmPassword-error' role='alert' className='text-sm text-destructive'>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

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
  )
}
