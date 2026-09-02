'use client'

import { AutoResizeTextarea } from '@/common/components/auto-resize-textarea'
import { type AttachmentItem, MultiImageUploadField } from '@/common/components/multi-image-upload-field'
import { useUploadAttachment } from '@/features/attachment/attachment.hooks'
import { useCreateThread } from '@/features/thread/thread.hooks'
import { createThreadSchema, type CreateThreadFormValues } from '@/features/thread/thread.schemas'
import type { ThreadDetail } from '@/features/thread/thread.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

const MAX_ATTACHMENTS = 4

interface CreateThreadFormProps {
  nestSlug: string
  onCreated: (thread: ThreadDetail) => void
}

export function CreateThreadForm({ nestSlug, onCreated }: CreateThreadFormProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)

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

  const uploadAttachment = useUploadAttachment()

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
    createThread.mutate({
      nestSlug,
      ...values,
      attachments: attachments.map(({ key, width, height }) => ({ key, width, height }))
    })
  })

  const isPending = createThread.isPending || isSubmitting || isUploadingAttachment

  return (
    <form onSubmit={onSubmit} noValidate className='flex w-full max-w-lg flex-col gap-3'>
      <div className='flex flex-col rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring'>
        <input
          id='title'
          type='text'
          autoComplete='off'
          placeholder='Title'
          aria-label='Title'
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className='border-0 border-b border-border bg-transparent px-3 py-2.5 text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground'
          {...register('title')}
        />

        <AutoResizeTextarea
          id='content'
          placeholder='Text'
          aria-label='Text'
          aria-invalid={errors.content ? 'true' : 'false'}
          aria-describedby={errors.content ? 'content-error' : undefined}
          className='min-h-[100px] border-0 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground'
          {...register('content')}
        />
      </div>

      {errors.title && (
        <p id='title-error' role='alert' className='text-sm text-destructive'>
          {errors.title.message}
        </p>
      )}

      {errors.content && (
        <p id='content-error' role='alert' className='text-sm text-destructive'>
          {errors.content.message}
        </p>
      )}

      <MultiImageUploadField
        items={attachments}
        onItemsChange={setAttachments}
        onUploadingChange={setIsUploadingAttachment}
        maxFiles={MAX_ATTACHMENTS}
        onUpload={(file) => uploadAttachment.mutateAsync(file)}
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
        {isPending ? 'Creating...' : 'Create thread'}
      </button>
    </form>
  )
}
