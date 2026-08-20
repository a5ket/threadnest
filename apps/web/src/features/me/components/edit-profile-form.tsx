'use client'

import { Avatar } from '@/common/components/avatar'
import { ImageUploadField } from '@/common/components/image-upload-field'
import { type GenericApiErrorCode } from '@/common/api-error'
import { updateProfileSchema, type UpdateProfileFormValues } from '@/features/me/me-profile.schemas'
import { useRemoveAvatar, useUpdateMeUser, useUpdateProfile, useUploadAvatar } from '@/features/me/me.hooks'
import type { UserProfileResponseDto } from '@/generated/api/models'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface EditProfileFormProps {
  profile: UserProfileResponseDto
  onSaved: (profile: UserProfileResponseDto) => void
  onCancel: () => void
}

function errorCodeOf(error: unknown): GenericApiErrorCode {
  return (error as { errorCode?: GenericApiErrorCode })?.errorCode ?? 'UNKNOWN_ERROR'
}

function messageForErrorCode(code: GenericApiErrorCode) {
  switch (code) {
    case 'VALIDATION_FAILED':
      return 'Please check the entered information'
    case 'NETWORK_ERROR':
      return 'Unable to connect. Check your internet connection.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export function EditProfileForm({ profile, onSaved, onCancel }: EditProfileFormProps) {
  // Avatar changes are staged locally and only committed to the server when the whole form is saved.
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [pendingAvatarRemoved, setPendingAvatarRemoved] = useState(false)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingAvatarFile) {
      setPendingPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(pendingAvatarFile)
    setPendingPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingAvatarFile])

  const previewUrl = pendingAvatarFile
    ? pendingPreviewUrl
    : pendingAvatarRemoved
      ? null
      : profile.avatarUrl

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: profile.username,
      displayName: profile.displayName ?? '',
      bio: profile.bio ?? ''
    }
  })

  const uploadAvatar = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()
  const updateProfile = useUpdateProfile()
  const updateMeUser = useUpdateMeUser()

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (pendingAvatarFile) {
        await uploadAvatar.mutateAsync(pendingAvatarFile)
      }
      else if (pendingAvatarRemoved) {
        await removeAvatar.mutateAsync()
      }

      // Always fetched last so the response reflects whatever avatar change just happened above.
      const latest = await updateProfile.mutateAsync(values)
      // The header (and anywhere else reading the global me-store) needs this too — it isn't
      // derived from page-local state, so a profile save wouldn't otherwise reach it.
      updateMeUser({ username: latest.username, avatarUrl: latest.avatarUrl })
      onSaved(latest)
    }
    catch (error) {
      const code = errorCodeOf(error)

      if (code === 'USERNAME_TAKEN') {
        setError('username', { type: 'server', message: 'This username is already taken' })
        return
      }

      setError('root', { type: 'server', message: messageForErrorCode(code) })
    }
  })

  const isPending = isSubmitting || uploadAvatar.isPending || removeAvatar.isPending || updateProfile.isPending

  return (
    <form onSubmit={onSubmit} noValidate className='flex w-full max-w-sm flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='username' className='text-sm font-medium'>
          Username
        </label>

        <input
          id='username'
          type='text'
          autoComplete='off'
          aria-invalid={errors.username ? 'true' : 'false'}
          aria-describedby={errors.username ? 'username-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('username')}
        />

        {errors.username && (
          <p id='username-error' role='alert' className='text-sm text-destructive'>
            {errors.username.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='displayName' className='text-sm font-medium'>
          Display name
        </label>

        <input
          id='displayName'
          type='text'
          autoComplete='off'
          aria-invalid={errors.displayName ? 'true' : 'false'}
          aria-describedby={errors.displayName ? 'displayName-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('displayName')}
        />

        {errors.displayName && (
          <p id='displayName-error' role='alert' className='text-sm text-destructive'>
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='bio' className='text-sm font-medium'>
          Bio
        </label>

        <textarea
          id='bio'
          rows={3}
          aria-invalid={errors.bio ? 'true' : 'false'}
          aria-describedby={errors.bio ? 'bio-error' : undefined}
          className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
          {...register('bio')}
        />

        {errors.bio && (
          <p id='bio-error' role='alert' className='text-sm text-destructive'>
            {errors.bio.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <span className='text-sm font-medium'>Avatar</span>

        <div className='flex items-center gap-4'>
          <Avatar avatarUrl={previewUrl} label={profile.displayName ?? profile.username} size={64} />

          <ImageUploadField
            label='avatar'
            hasImage={Boolean(previewUrl)}
            isUploading={false}
            outputSize={512}
            shape='circle'
            onUpload={(file) => {
              setPendingAvatarFile(file)
              setPendingAvatarRemoved(false)
            }}
            onRemove={() => {
              setPendingAvatarFile(null)
              setPendingAvatarRemoved(true)
            }}
          />
        </div>
      </div>

      {errors.root && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.root.message}
        </p>
      )}

      <div className='flex items-center gap-3'>
        <button
          type='submit'
          disabled={isPending}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isPending ? 'Saving...' : 'Save profile'}
        </button>

        <button
          type='button'
          disabled={isPending}
          onClick={onCancel}
          className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
