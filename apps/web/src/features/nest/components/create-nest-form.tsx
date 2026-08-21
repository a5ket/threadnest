'use client'

import { ImageUploadField } from '@/common/components/image-upload-field'
import { Select } from '@/common/components/select'
import { type GenericApiErrorCode } from '@/common/api-error'
import { useAddNest } from '@/features/me/me.hooks'
import { useCreateNest, useUploadNestIcon } from '@/features/nest/nest.hooks'
import { createNestSchema, type CreateNestFormValues } from '@/features/nest/nest.schemas'
import type { NestDetail } from '@/features/nest/nest.types'
import { NestCreateDtoJoinPolicy, NestCreateDtoVisibility } from '@/generated/api/models'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface CreateNestFormProps {
  onCreated: (nest: NestDetail) => void
}

function errorCodeOf(error: unknown): GenericApiErrorCode {
  return (error as { errorCode?: GenericApiErrorCode })?.errorCode ?? 'UNKNOWN_ERROR'
}

export function CreateNestForm({ onCreated }: CreateNestFormProps) {
  const addNest = useAddNest()
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null)
  const [pendingIconPreviewUrl, setPendingIconPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingIconFile) {
      setPendingIconPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(pendingIconFile)
    setPendingIconPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingIconFile])

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<CreateNestFormValues>({
    resolver: zodResolver(createNestSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      visibility: NestCreateDtoVisibility.PUBLIC,
      joinPolicy: NestCreateDtoJoinPolicy.OPEN
    }
  })

  const name = watch('name')
  const createNest = useCreateNest()
  const uploadIcon = useUploadNestIcon()

  const onSubmit = handleSubmit(async (values) => {
    let nest: NestDetail

    try {
      nest = await createNest.mutateAsync(values)
    }
    catch (error) {
      const code = errorCodeOf(error)

      switch (code) {
        case 'NEST_SLUG_RESERVED':
          setError('slug', { type: 'server', message: 'This slug is reserved' })
          break

        case 'NEST_SLUG_TAKEN':
          setError('slug', { type: 'server', message: 'This slug is already taken' })
          break

        case 'NEST_LIMIT_REACHED':
          setError('root', { type: 'server', message: 'You\'ve reached the maximum number of nests you can own' })
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('root', { type: 'server', message: 'Verify your email before creating a nest' })
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

      return
    }

    // The nest now exists — treat creation as done regardless of what happens next, so a
    // failed icon upload doesn't strand the user on a form for a nest that already exists.
    addNest({ name: nest.name, slug: nest.slug })

    if (pendingIconFile) {
      try {
        nest = await uploadIcon.mutateAsync({ nestSlug: nest.slug, file: pendingIconFile })
      }
      catch {
        // Icon can still be added from the nest's settings page afterward.
      }
    }

    onCreated(nest)
  })

  const isPending = isSubmitting || createNest.isPending || uploadIcon.isPending

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

      <div className='flex flex-col gap-1.5'>
        <span className='text-sm font-medium'>Icon</span>

        <div className='flex items-center gap-4'>
          <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-muted'>
            {pendingIconPreviewUrl
              ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pendingIconPreviewUrl} alt='' className='h-full w-full object-cover' />
                )
              : (
                  <span className='text-lg font-medium text-muted-foreground'>{(name || '?').charAt(0).toUpperCase()}</span>
                )}
          </div>

          <ImageUploadField
            label='icon'
            hasImage={Boolean(pendingIconFile)}
            isUploading={false}
            outputSize={256}
            shape='square'
            onUpload={(file) => setPendingIconFile(file)}
            onRemove={() => setPendingIconFile(null)}
          />
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='visibility' className='text-sm font-medium'>
          Visibility
        </label>

        <Select
          id='visibility'
          value={watch('visibility') as NestCreateDtoVisibility}
          onChange={(value) => setValue('visibility', value, { shouldDirty: true })}
          options={[
            { value: NestCreateDtoVisibility.PUBLIC, label: 'Public' },
            { value: NestCreateDtoVisibility.PRIVATE, label: 'Private' }
          ]}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='joinPolicy' className='text-sm font-medium'>
          Join policy
        </label>

        <Select
          id='joinPolicy'
          value={watch('joinPolicy') as NestCreateDtoJoinPolicy}
          onChange={(value) => setValue('joinPolicy', value, { shouldDirty: true })}
          options={[
            { value: NestCreateDtoJoinPolicy.OPEN, label: 'Open' },
            { value: NestCreateDtoJoinPolicy.BY_REQUEST, label: 'By request' },
            { value: NestCreateDtoJoinPolicy.BY_INVITE, label: 'By invite' }
          ]}
        />
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
