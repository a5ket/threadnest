'use client'

import { AutoResizeTextarea } from '@/common/components/auto-resize-textarea'
import { useUpdateComment } from '@/features/comment/comment.hooks'
import { updateCommentSchema, type UpdateCommentFormValues } from '@/features/comment/comment.schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

interface EditCommentFormProps {
  commentId: string
  content: string
  onSaved: () => void
  onCancel: () => void
}

export function EditCommentForm({ commentId, content, onSaved, onCancel }: EditCommentFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<UpdateCommentFormValues>({
    resolver: zodResolver(updateCommentSchema),
    defaultValues: { content }
  })

  const updateComment = useUpdateComment({
    onSuccess: onSaved,
    onError: (error) => {
      switch (error.errorCode) {
        case 'INSUFFICIENT_PERMISSIONS':
          setError('root', { type: 'server', message: 'You don\'t have permission to edit this comment' })
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('root', { type: 'server', message: 'Please verify your email to edit comments' })
          break

        case 'COMMENT_NOT_FOUND':
        case 'THREAD_NOT_FOUND':
          setError('root', { type: 'server', message: 'This comment no longer exists' })
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
    updateComment.mutate({ commentId, content: values.content })
  })

  const isPending = updateComment.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-2'>
      <AutoResizeTextarea
        autoFocus
        aria-invalid={errors.content ? 'true' : 'false'}
        className='min-h-[40px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
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
          type='button'
          onClick={onCancel}
          className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted'
        >
          Cancel
        </button>

        <button
          type='submit'
          disabled={isPending}
          className='rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
