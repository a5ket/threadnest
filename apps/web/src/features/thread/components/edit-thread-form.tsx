'use client'

import { AutoResizeTextarea } from '@/common/components/auto-resize-textarea'
import { type AttachmentItem, MultiImageUploadField } from '@/common/components/multi-image-upload-field'
import { useUploadAttachment } from '@/features/attachment/attachment.hooks'
import { useUpdateThread } from '@/features/thread/thread.hooks'
import { updateThreadSchema, type UpdateThreadFormValues } from '@/features/thread/thread.schemas'
import type { ThreadDetail } from '@/features/thread/thread.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

const MAX_ATTACHMENTS = 4

interface EditThreadFormProps {
  nestSlug: string
  threadSlug: string
  thread: ThreadDetail
  onSaved: (thread: ThreadDetail) => void
  onCancel: () => void
}

export function EditThreadForm({ nestSlug, threadSlug, thread, onSaved, onCancel }: EditThreadFormProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>(thread.attachments)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)

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

  const uploadAttachment = useUploadAttachment()

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
    updateThread.mutate({
      nestSlug,
      threadSlug,
      ...values,
      attachments: attachments.map(({ key, width, height }) => ({ key, width, height }))
    })
  })

  const isPending = updateThread.isPending || isSubmitting || isUploadingAttachment

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-3'>
      <div className='flex flex-col rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring'>
        <input
          id='edit-title'
          type='text'
          autoComplete='off'
          placeholder='Title'
          aria-label='Title'
          aria-invalid={errors.title ? 'true' : 'false'}
          className='border-0 border-b border-border bg-transparent px-3 py-2.5 text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground'
          {...register('title')}
        />

        <AutoResizeTextarea
          id='edit-content'
          placeholder='Text'
          aria-label='Text'
          aria-invalid={errors.content ? 'true' : 'false'}
          className='min-h-[100px] border-0 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground'
          {...register('content')}
        />
      </div>

      {errors.title && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.title.message}
        </p>
      )}

      {errors.content && (
        <p role='alert' className='text-sm text-destructive'>
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

      <div className='flex gap-2'>
        <button
          type='button'
          onClick={onCancel}
          className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'
        >
          Cancel
        </button>

        <button
          type='submit'
          disabled={isPending}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
