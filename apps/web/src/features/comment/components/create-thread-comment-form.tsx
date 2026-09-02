'use client'

import { AutoResizeTextarea } from '@/common/components/auto-resize-textarea'
import { type AttachmentItem, MultiImageUploadField } from '@/common/components/multi-image-upload-field'
import { useUploadAttachment } from '@/features/attachment/attachment.hooks'
import { useCreateThreadComment } from '@/features/comment/comment.hooks'
import { createCommentSchema, type CreateCommentFormValues } from '@/features/comment/comment.schemas'
import type { CommentDetail } from '@/features/comment/comment.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface CreateThreadCommentFormProps {
  nestSlug: string
  threadSlug: string
  onCreated: (comment: CommentDetail) => void
}

export function CreateThreadCommentForm({ nestSlug, threadSlug, onCreated }: CreateThreadCommentFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const uploadAttachment = useUploadAttachment()

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
      setAttachments([])
      setIsExpanded(false)
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
    const [attachment] = attachments
    createComment.mutate({
      nestSlug,
      threadSlug,
      content: values.content,
      attachment: attachment ? { key: attachment.key, width: attachment.width, height: attachment.height } : undefined
    })
  })

  const isPending = createComment.isPending || isSubmitting || isUploadingAttachment

  if (!isExpanded) {
    return (
      <button
        type='button'
        onClick={() => setIsExpanded(true)}
        className='w-full rounded-md border border-input bg-background px-3 py-2.5 text-left text-sm text-muted-foreground outline-none transition-colors hover:border-ring'
      >
        Add a comment...
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-2'>
      <div className='flex flex-col rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring'>
        <AutoResizeTextarea
          id='comment-content'
          autoFocus
          placeholder='Add a comment...'
          aria-invalid={errors.content ? 'true' : 'false'}
          aria-describedby={errors.content ? 'comment-content-error' : undefined}
          className='min-h-[40px] border-0 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground'
          {...register('content')}
        />

        <div className='flex items-end justify-between gap-2 px-2 pb-2'>
          <MultiImageUploadField
            items={attachments}
            onItemsChange={setAttachments}
            onUploadingChange={setIsUploadingAttachment}
            maxFiles={1}
            onUpload={(file) => uploadAttachment.mutateAsync(file)}
          />

          <button
            type='submit'
            disabled={isPending}
            className='shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
          >
            {isPending ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>

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
    </form>
  )
}
