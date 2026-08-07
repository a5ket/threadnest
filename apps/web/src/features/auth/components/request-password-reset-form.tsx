'use client'

import { useRequestPasswordReset } from '@/features/auth/auth.hooks'
import { requestPasswordResetSchema, type RequestPasswordResetFormValues } from '@/features/auth/auth.schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export function RequestPasswordResetForm() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<RequestPasswordResetFormValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: ''
    }
  })

  const requestReset = useRequestPasswordReset({
    onSuccess: () => setSent(true),
    onError: (error) => {
      setSent(false)

      switch (error.errorCode) {
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
    setSent(false)
    requestReset.mutate(values)
  })

  const isPending = requestReset.isPending || isSubmitting

  if (sent) {
    return (
      <p className='w-full max-w-sm text-center text-sm'>
        {'If an account exists for that email, we\'ve sent a password reset link.'}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className='flex w-full max-w-sm flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='email' className='text-sm font-medium'>
          Email
        </label>

        <input
          id='email'
          type='email'
          autoComplete='email'
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('email')}
        />

        {errors.email && (
          <p id='email-error' role='alert' className='text-sm text-destructive'>
            {errors.email.message}
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
        {isPending ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  )
}
