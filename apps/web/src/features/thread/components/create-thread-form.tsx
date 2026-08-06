'use client'

import { useCreateThread } from '@/features/thread/thread.hooks'
import { createThreadSchema, type CreateThreadFormValues } from '@/features/thread/thread.schemas'
import type { ThreadDetail } from '@/features/thread/thread.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface CreateThreadFormProps {
  nestSlug: string
  onCreated: (thread: ThreadDetail) => void
}

export function CreateThreadForm({ nestSlug, onCreated }: CreateThreadFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CreateThreadFormValues>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      title: '',
      content: ''
    }
  })

  const createThread = useCreateThread({
    onSuccess: onCreated,
    onError: (error) => {
      switch (error.errorCode) {
        case 'INSUFFICIENT_PERMISSIONS':
          setError('root', {
            type: 'server',
            message: 'You don\'t have permission to create a thread here'
          })
          break

        case 'NEST_NOT_FOUND':
          setError('root', {
            type: 'server',
            message: 'This nest no longer exists'
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
    createThread.mutate({ nestSlug, ...values })
  })

  const isPending = createThread.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex w-full max-w-sm flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='title' className='text-sm font-medium'>
          Title
        </label>

        <input
          id='title'
          type='text'
          autoComplete='off'
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('title')}
        />

        {errors.title && (
          <p id='title-error' role='alert' className='text-sm text-destructive'>
            {errors.title.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='content' className='text-sm font-medium'>
          Content
        </label>

        <textarea
          id='content'
          rows={6}
          aria-invalid={errors.content ? 'true' : 'false'}
          aria-describedby={errors.content ? 'content-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('content')}
        />

        {errors.content && (
          <p id='content-error' role='alert' className='text-sm text-destructive'>
            {errors.content.message}
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
        {isPending ? 'Creating...' : 'Create thread'}
      </button>
    </form>
  )
}
