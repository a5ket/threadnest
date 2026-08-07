'use client'

import { changeEmailSchema, type ChangeEmailFormValues } from '@/features/me/me-auth.schemas'
import { useChangeEmail } from '@/features/me/me.hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export function ChangeEmailForm() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      email: ''
    }
  })

  const changeEmail = useChangeEmail({
    onSuccess: () => {
      setSent(true)
      reset()
    },
    onError: (error) => {
      setSent(false)

      switch (error.errorCode) {
        case 'EMAIL_TAKEN':
          setError('email', { type: 'server', message: 'This email is already in use' })
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
    setSent(false)
    changeEmail.mutate(values)
  })

  const isPending = changeEmail.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex w-full max-w-sm flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='email' className='text-sm font-medium'>
          New email address
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

      {sent && !errors.root && (
        <p className='text-sm text-muted-foreground'>Check your new email address for a confirmation link.</p>
      )}

      <button
        type='submit'
        disabled={isPending}
        className='self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
      >
        {isPending ? 'Sending...' : 'Send confirmation link'}
      </button>
    </form>
  )
}
