'use client'

import { useCreateThreadComment } from '@/features/comment/comment.hooks'
import { createCommentSchema, type CreateCommentFormValues } from '@/features/comment/comment.schemas'
import type { CommentDetail } from '@/features/comment/comment.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface CreateThreadCommentFormProps {
  nestSlug: string
  threadSlug: string
  onCreated: (comment: CommentDetail) => void
}

export function CreateThreadCommentForm({ nestSlug, threadSlug, onCreated }: CreateThreadCommentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CreateCommentFormValues>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: '' }
  })

  const createComment = useCreateThreadComment({
    onSuccess: (comment) => {
      reset()
      onCreated(comment)
    },
    onError: (error) => {
      switch (error.errorCode) {
        case 'INSUFFICIENT_PERMISSIONS':
          setError('root', { type: 'server', message: 'You don\'t have permission to comment on this thread' })
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('root', { type: 'server', message: 'Please verify your email to comment' })
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
    createComment.mutate({ nestSlug, threadSlug, content: values.content })
  })

  const isPending = createComment.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-2'>
      <textarea
        id='comment-content'
        rows={3}
        placeholder='Add a comment...'
        aria-invalid={errors.content ? 'true' : 'false'}
        aria-describedby={errors.content ? 'comment-content-error' : undefined}
        className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
        {...register('content')}
      />

      {errors.content && (
        <p id='comment-content-error' role='alert' className='text-sm text-destructive'>
          {errors.content.message}
        </p>
      )}

      {errors.root && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.root.message}
        </p>
      )}

      <button
        type='submit'
        disabled={isPending}
        className='self-start rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
      >
        {isPending ? 'Posting...' : 'Comment'}
      </button>
    </form>
  )
}
