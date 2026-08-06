'use client'

import { useUpdateNestSettings } from '@/features/nest/nest-settings.hooks'
import { updateNestSettingsSchema, type UpdateNestSettingsFormValues } from '@/features/nest/nest-settings.schemas'
import type { NestSettings } from '@/features/nest/nest-settings.types'
import { NestSettingsUpdateDtoJoinPolicy, NestSettingsUpdateDtoVisibility } from '@/generated/api/models'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

interface NestSettingsFormProps {
  nestSlug: string
  settings: NestSettings
  readOnly: boolean
}

const ROLE_OPTIONS = ['MEMBER', 'MODERATOR', 'OWNER'] as const

const PERMISSION_FIELDS: { name: keyof UpdateNestSettingsFormValues, label: string }[] = [
  { name: 'minThreadCreationRole', label: 'Create threads' },
  { name: 'minCommentCreationRole', label: 'Comment' },
  { name: 'minNestEditRole', label: 'Edit nest details' },
  { name: 'minThreadLockManageRole', label: 'Lock/unlock threads' },
  { name: 'minThreadPinManageRole', label: 'Pin/unpin threads' },
  { name: 'minCommentPinManageRole', label: 'Pin/unpin comments' },
  { name: 'minContentModerateRole', label: 'Moderate content' },
  { name: 'minMemberViewRole', label: 'View member list' },
  { name: 'minInviteManageRole', label: 'Manage invites' },
  { name: 'minMemberRemoveRole', label: 'Remove members' },
  { name: 'minJoinRequestManageRole', label: 'Manage join requests' },
  { name: 'minBanManageRole', label: 'Manage bans' }
]

export function NestSettingsForm({ nestSlug, settings, readOnly }: NestSettingsFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: {
      isSubmitting,
      errors
    }
  } = useForm<UpdateNestSettingsFormValues>({
    resolver: zodResolver(updateNestSettingsSchema),
    defaultValues: settings
  })

  const updateSettings = useUpdateNestSettings({
    onError: (error) => {
      switch (error.errorCode) {
        case 'INSUFFICIENT_PERMISSIONS':
          setError('root', { type: 'server', message: 'You don\'t have permission to update these settings' })
          break

        case 'EMAIL_VERIFICATION_REQUIRED':
          setError('root', { type: 'server', message: 'Please verify your email to update settings' })
          break

        case 'NEST_NOT_FOUND':
        case 'NEST_SETTINGS_NOT_FOUND':
          setError('root', { type: 'server', message: 'This nest no longer exists' })
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
    updateSettings.mutate({ nestSlug, ...values })
  })

  const isPending = updateSettings.isPending || isSubmitting

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4'>
        <h2 className='text-sm font-semibold'>General</h2>

        <div className='flex flex-col gap-1.5'>
          <label htmlFor='visibility' className='text-sm font-medium'>
            Visibility
          </label>

          <select
            id='visibility'
            disabled={readOnly}
            className='rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50'
            {...register('visibility')}
          >
            <option value={NestSettingsUpdateDtoVisibility.PUBLIC}>Public</option>
            <option value={NestSettingsUpdateDtoVisibility.PRIVATE}>Private</option>
          </select>
        </div>

        <div className='flex flex-col gap-1.5'>
          <label htmlFor='joinPolicy' className='text-sm font-medium'>
            Join policy
          </label>

          <select
            id='joinPolicy'
            disabled={readOnly}
            className='rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50'
            {...register('joinPolicy')}
          >
            <option value={NestSettingsUpdateDtoJoinPolicy.OPEN}>Open</option>
            <option value={NestSettingsUpdateDtoJoinPolicy.BY_REQUEST}>By request</option>
            <option value={NestSettingsUpdateDtoJoinPolicy.BY_INVITE}>By invite</option>
          </select>
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        <h2 className='text-sm font-semibold'>Permissions</h2>

        {PERMISSION_FIELDS.map(({ name, label }) => (
          <div key={name} className='flex items-center justify-between gap-4'>
            <label htmlFor={name} className='text-sm'>
              {label}
            </label>

            <select
              id={name}
              disabled={readOnly}
              className='rounded-md border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50'
              {...register(name)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {errors.root && (
        <p role='alert' className='text-sm text-destructive'>
          {errors.root.message}
        </p>
      )}

      {!readOnly && (
        <button
          type='submit'
          disabled={isPending}
          className='self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
        >
          {isPending ? 'Saving...' : 'Save settings'}
        </button>
      )}
    </form>
  )
}
