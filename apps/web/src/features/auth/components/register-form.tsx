'use client'

import { useAuthSuccessHandler, useRegister } from '@/features/auth/auth.hooks'
import { registerSchema, type RegisterFormValues } from '@/features/auth/auth.schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AuthDivider } from './auth-divider'
import { AuthField } from './auth-field'
import { AuthLinkOrAction } from './auth-link-or-action'
import { GoogleSignInButton } from './google-sign-in-button'

interface RegisterFormProps {
  onAuthenticated: () => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ onAuthenticated, onSwitchToLogin }: RegisterFormProps) {
  const handleAuthenticated = useAuthSuccessHandler(onAuthenticated)

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
    <div className='flex w-full flex-col gap-6'>
      <div>
        <h1 className='text-xl font-semibold'>Create your account</h1>
        <p className='text-sm text-muted-foreground'>Join ThreadNest and start your own communities.</p>
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
          autoComplete='new-password'
          error={errors.password?.message}
          registration={register('password')}
        />

        <AuthField
          id='confirmPassword'
          label='Confirm password'
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
          {isPending ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      <p className='text-center text-sm text-muted-foreground'>
        Already have an account?
        {' '}
        <AuthLinkOrAction href='/login' onAction={onSwitchToLogin} className='font-medium text-primary hover:underline'>
          Log in
        </AuthLinkOrAction>
      </p>
    </div>
  )
}
