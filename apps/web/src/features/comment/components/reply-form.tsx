'use client'

import { useReplyToComment } from '@/features/comment/comment.hooks'
import { createCommentSchema, type CreateCommentFormValues } from '@/features/comment/comment.schemas'
import type { CommentDetail } from '@/features/comment/comment.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface ReplyFormProps {
  commentId: string
  onCreated: (reply: CommentDetail) => void
  onCancel: () => void
}

export function ReplyForm({ commentId, onCreated, onCancel }: ReplyFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CreateCommentFormValues>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: '' }
  })

  const replyToComment = useReplyToComment({
    onSuccess: onCreated,
    onError: (error) => {
      switch (error.errorCode) {
        case 'INSUFFICIENT_PERMISSIONS':
          setError('root', { type: 'server', message: 'You don\'t have permission to reply here' })
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('root', { type: 'server', message: 'Please verify your email to reply' })
          break

        case 'COMMENT_NOT_FOUND':
          setError('root', { type: 'server', message: 'This comment no longer exists' })
          break

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
    replyToComment.mutate({ commentId, content: values.content })
  })

  const isPending = replyToComment.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-2'>
      <textarea
        rows={2}
        placeholder='Write a reply...'
        autoFocus
        aria-invalid={errors.content ? 'true' : 'false'}
        className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
        {...register('content')}
      />

      {errors.content && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.content.message}
        </p>
      )}

      {errors.root && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.root.message}
        </p>
      )}

      <div className='flex gap-2'>
        <button
          type='submit'
          disabled={isPending}
          className='rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isPending ? 'Posting...' : 'Reply'}
        </button>

        <button
          type='button'
          onClick={onCancel}
          className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
