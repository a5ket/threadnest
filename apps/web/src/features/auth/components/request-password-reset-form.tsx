'use client'

import { useRequestPasswordReset } from '@/features/auth/auth.hooks'
import { requestPasswordResetSchema, type RequestPasswordResetFormValues } from '@/features/auth/auth.schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthField } from './auth-field'
import { AuthLinkOrAction } from './auth-link-or-action'

interface RequestPasswordResetFormProps {
  onSwitchToLogin?: () => void
}

export function RequestPasswordResetForm({ onSwitchToLogin }: RequestPasswordResetFormProps) {
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

  return (
    <div className='flex w-full flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Reset your password</h1>
        <p className='text-sm text-muted-foreground'>We&apos;ll email you a link to reset it.</p>
      </div>

      {sent
        ? (
            <p className='text-sm text-muted-foreground'>
              {'If an account exists for that email, we\'ve sent a password reset link.'}
            </p>
          )
        : (
            <form onSubmit={onSubmit} noValidate className='flex flex-col gap-4'>
              <AuthField
                id='email'
                label='Email'
                type='email'
                autoComplete='email'
                error={errors.email?.message}
                registration={register('email')}
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
                {isPending ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

      <p className='text-center text-sm text-muted-foreground'>
        <AuthLinkOrAction href='/login' onAction={onSwitchToLogin} className='font-medium text-primary hover:underline'>
          Back to log in
        </AuthLinkOrAction>
      </p>
    </div>
  )
}
