'use client'

import { useAuthSuccessHandler, useRegister } from '@/features/auth/auth.hooks'
import { registerSchema, type RegisterFormValues } from '@/features/auth/auth.schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

interface RegisterFormProps {
  onAuthenticated?: () => void
}

export function RegisterForm({ onAuthenticated }: RegisterFormProps = {}) {
  const router = useRouter()
  const handleAuthenticated = useAuthSuccessHandler(onAuthenticated ?? (() => router.push('/')))

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  const signUp = useRegister({
    onSuccess: handleAuthenticated,
    onError: (error) => {
      switch (error.errorCode) {
        case 'EMAIL_TAKEN':
          setError('email', {
            type: 'server',
            message: 'An account with this email already exists'
          })
          break

        case 'VALIDATION_FAILED':
          setError('root', {
            type: 'server',
            message: 'Please check the entered information'
          })

          // Map server validation errors to fields if needed.
          break

        case 'NETWORK_ERROR':
          setError('root', {
            type: 'server',
            message: 'Unable to connect. Check your internet connection.'
          })
          break

        default:
          setError('root', {
            type: 'server',
            message: 'Something went wrong. Please try again.'
          })
      }
    }
  })

  const onSubmit = handleSubmit(({ email, password }) => {
    signUp.mutate({ email, password })
  })

  const isPending = signUp.isPending || isSubmitting

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

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='password' className='text-sm font-medium'>
          Password
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
          Confirm password
        </label>

        <input
          id='confirmPassword'
          type='password'
          autoComplete='new-password'
          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('confirmPassword')}
        />

        {errors.confirmPassword && (
          <p id='confirm-password-error' role='alert' className='text-sm text-destructive'>
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
        {isPending ? 'Signing up...' : 'Sign up'}
      </button>
    </form>
  )
}
