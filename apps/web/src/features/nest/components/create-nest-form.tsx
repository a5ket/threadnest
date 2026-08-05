'use client'

import { useCreateNest } from '@/features/nest/nest.hooks'
import { createNestSchema, type CreateNestFormValues } from '@/features/nest/nest.schemas'
import type { NestDetail } from '@/features/nest/nest.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface CreateNestFormProps {
  onCreated: (nest: NestDetail) => void
}

export function CreateNestForm({ onCreated }: CreateNestFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CreateNestFormValues>({
    resolver: zodResolver(createNestSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: ''
    }
  })

  const createNest = useCreateNest({
    onSuccess: onCreated,
    onError: (error) => {
      switch (error.errorCode) {
        case 'NEST_SLUG_RESERVED':
          setError('slug', {
            type: 'server',
            message: 'This slug is reserved'
          })
          break

        case 'NEST_SLUG_TAKEN':
          setError('slug', {
            type: 'server',
            message: 'This slug is already taken'
          })
          break

        case 'NEST_LIMIT_REACHED':
          setError('root', {
            type: 'server',
            message: 'You\'ve reached the maximum number of nests you can own'
          })
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('root', {
            type: 'server',
            message: 'Verify your email before creating a nest'
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
    createNest.mutate(values)
  })

  const isPending = createNest.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex w-full max-w-sm flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='name' className='text-sm font-medium'>
          Name
        </label>

        <input
          id='name'
          type='text'
          autoComplete='off'
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('name')}
        />

        {errors.name && (
          <p id='name-error' role='alert' className='text-sm text-destructive'>
            {errors.name.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='slug' className='text-sm font-medium'>
          Slug
        </label>

        <input
          id='slug'
          type='text'
          autoComplete='off'
          aria-invalid={errors.slug ? 'true' : 'false'}
          aria-describedby={errors.slug ? 'slug-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('slug')}
        />

        {errors.slug && (
          <p id='slug-error' role='alert' className='text-sm text-destructive'>
            {errors.slug.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='description' className='text-sm font-medium'>
          Description
        </label>

        <textarea
          id='description'
          rows={3}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('description')}
        />

        {errors.description && (
          <p id='description-error' role='alert' className='text-sm text-destructive'>
            {errors.description.message}
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
        {isPending ? 'Creating...' : 'Create nest'}
      </button>
    </form>
  )
}
