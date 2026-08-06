'use client'

import { useUpdateThread } from '@/features/thread/thread.hooks'
import { updateThreadSchema, type UpdateThreadFormValues } from '@/features/thread/thread.schemas'
import type { ThreadDetail } from '@/features/thread/thread.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface EditThreadFormProps {
  nestSlug: string
  threadSlug: string
  thread: ThreadDetail
  onSaved: (thread: ThreadDetail) => void
  onCancel: () => void
}

export function EditThreadForm({ nestSlug, threadSlug, thread, onSaved, onCancel }: EditThreadFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<UpdateThreadFormValues>({
    resolver: zodResolver(updateThreadSchema),
    defaultValues: {
      title: thread.title,
      content: thread.content ?? ''
    }
  })

  const updateThread = useUpdateThread({
    onSuccess: onSaved,
    onError: (error) => {
      switch (error.errorCode) {
        case 'INSUFFICIENT_PERMISSIONS':
          setError('root', { type: 'server', message: 'You don\'t have permission to edit this thread' })
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('root', { type: 'server', message: 'Please verify your email to edit threads' })
          break

        case 'NEST_NOT_FOUND':
        case 'THREAD_NOT_FOUND':
          setError('root', { type: 'server', message: 'This thread no longer exists' })
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
    updateThread.mutate({ nestSlug, threadSlug, ...values })
  })

  const isPending = updateThread.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='edit-title' className='text-sm font-medium'>
          Title
        </label>

        <input
          id='edit-title'
          type='text'
          autoComplete='off'
          aria-invalid={errors.title ? 'true' : 'false'}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('title')}
        />

        {errors.title && (
          <p role='alert' className='text-sm text-destructive'>
            {errors.title.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='edit-content' className='text-sm font-medium'>
          Content
        </label>

        <textarea
          id='edit-content'
          rows={6}
          aria-invalid={errors.content ? 'true' : 'false'}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('content')}
        />

        {errors.content && (
          <p role='alert' className='text-sm text-destructive'>
            {errors.content.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.root.message}
        </p>
      )}

      <div className='flex gap-2'>
        <button
          type='submit'
          disabled={isPending}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>

        <button
          type='button'
          onClick={onCancel}
          className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
