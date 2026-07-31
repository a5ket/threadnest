'use client'

import { useAuthSuccessHandler, useLogin } from '@/features/auth/auth.hooks'
import { loginSchema, type LoginFormValues } from '@/features/auth/auth.schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

interface LoginFormProps {
  onAuthenticated?: () => void
}

export function LoginForm({ onAuthenticated }: LoginFormProps = {}) {
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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const login = useLogin({
    onSuccess: handleAuthenticated,
    onError: (error) => {
      switch (error.errorCode) {
        case 'INVALID_CREDENTIALS':
          setError('root', {
            type: 'server',
            message: 'Invalid email or password'
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

  const onSubmit = handleSubmit((values) => {
    login.mutate(values)
  })

  const isPending = login.isPending || isSubmitting

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
          autoComplete='current-password'
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
        {isPending ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  )
}
