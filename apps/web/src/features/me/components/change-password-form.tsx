'use client'

import { changePasswordSchema, type ChangePasswordFormValues } from '@/features/me/me-auth.schemas'
import { useChangePassword } from '@/features/me/me.hooks'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export function ChangePasswordForm() {
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  })

  const changePassword = useChangePassword({
    onSuccess: () => {
      setSaved(true)
      reset()
    },
    onError: (error) => {
      setSaved(false)

      switch (error.errorCode) {
        case 'INVALID_CREDENTIALS':
          setError('currentPassword', { type: 'server', message: 'Current password is incorrect' })
          break

        case 'SAME_PASSWORD':
          setError('newPassword', { type: 'server', message: 'New password must be different from the current password' })
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
    setSaved(false)
    changePassword.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword })
  })

  const isPending = changePassword.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex w-full max-w-sm flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='currentPassword' className='text-sm font-medium'>
          Current password
        </label>

        <input
          id='currentPassword'
          type='password'
          autoComplete='current-password'
          aria-invalid={errors.currentPassword ? 'true' : 'false'}
          aria-describedby={errors.currentPassword ? 'currentPassword-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('currentPassword')}
        />

        {errors.currentPassword && (
          <p id='currentPassword-error' role='alert' className='text-sm text-destructive'>
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='newPassword' className='text-sm font-medium'>
          New password
        </label>

        <input
          id='newPassword'
          type='password'
          autoComplete='new-password'
          aria-invalid={errors.newPassword ? 'true' : 'false'}
          aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('newPassword')}
        />

        {errors.newPassword && (
          <p id='newPassword-error' role='alert' className='text-sm text-destructive'>
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='confirmNewPassword' className='text-sm font-medium'>
          Confirm new password
        </label>

        <input
          id='confirmNewPassword'
          type='password'
          autoComplete='new-password'
          aria-invalid={errors.confirmNewPassword ? 'true' : 'false'}
          aria-describedby={errors.confirmNewPassword ? 'confirmNewPassword-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('confirmNewPassword')}
        />

        {errors.confirmNewPassword && (
          <p id='confirmNewPassword-error' role='alert' className='text-sm text-destructive'>
            {errors.confirmNewPassword.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.root.message}
        </p>
      )}

      {saved && !errors.root && (
        <p className='text-sm text-muted-foreground'>Password changed.</p>
      )}

      <button
        type='submit'
        disabled={isPending}
        className='self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
      >
        {isPending ? 'Changing...' : 'Change password'}
      </button>
    </form>
  )
}
