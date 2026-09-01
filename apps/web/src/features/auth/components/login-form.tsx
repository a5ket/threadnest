'use client'

import { useAuthSuccessHandler, useLogin } from '@/features/auth/auth.hooks'
import { loginSchema, type LoginFormValues } from '@/features/auth/auth.schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AuthDivider } from './auth-divider'
import { AuthField } from './auth-field'
import { AuthLinkOrAction } from './auth-link-or-action'
import { GoogleSignInButton } from './google-sign-in-button'

interface LoginFormProps {
  onAuthenticated: () => void
  onSwitchToRegister?: () => void
  onSwitchToResetPassword?: () => void
}

export function LoginForm({ onAuthenticated, onSwitchToRegister, onSwitchToResetPassword }: LoginFormProps) {
  const handleAuthenticated = useAuthSuccessHandler(onAuthenticated)

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
    <div className='flex w-full flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Welcome back</h1>
        <p className='text-sm text-muted-foreground'>Log in to continue to ThreadNest.</p>
      </div>

      <GoogleSignInButton />

      <AuthDivider />

      <form onSubmit={onSubmit} noValidate className='flex flex-col gap-4'>
        <AuthField
          id='email'
          label='Email'
          type='email'
          autoComplete='email'
          error={errors.email?.message}
          registration={register('email')}
        />

        <AuthField
          id='password'
          label='Password'
          type='password'
          autoComplete='current-password'
          error={errors.password?.message}
          registration={register('password')}
          trailing={(
            <AuthLinkOrAction
              href='/reset-password'
              onAction={onSwitchToResetPassword}
              className='text-xs text-muted-foreground hover:underline'
            >
              Forgot password?
            </AuthLinkOrAction>
          )}
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
          {isPending ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className='text-center text-sm text-muted-foreground'>
        {'Don\'t have an account? '}
        <AuthLinkOrAction href='/register' onAction={onSwitchToRegister} className='font-medium text-primary hover:underline'>
          Sign up
        </AuthLinkOrAction>
      </p>
    </div>
  )
}
