'use client'

import { ConfirmDialog } from '@/common/components/confirm-dialog'
import { Select } from '@/common/components/select'
import { useUpdateNestSettings } from '@/features/nest/nest-settings.hooks'
import { updateNestSettingsSchema, type UpdateNestSettingsFormValues } from '@/features/nest/nest-settings.schemas'
import type { NestSettings } from '@/features/nest/nest-settings.types'
import { NestSettingsUpdateDtoJoinPolicy, NestSettingsUpdateDtoVisibility } from '@/generated/api/models'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface NestSettingsFormProps {
  nestSlug: string
  settings: NestSettings
  readOnly: boolean
}

const NON_MEMBER_LEVEL = 0
const MEMBER_LEVEL = 10

const LEVEL_LABELS: Record<number, string> = {
  [NON_MEMBER_LEVEL]: 'Anyone',
  [MEMBER_LEVEL]: 'Member',
  20: 'Moderator',
  30: 'Owner'
}

const MANAGEMENT_LEVELS = [10, 20, 30]
const ACTION_LOG_LEVELS = [20, 30]

type PermissionFieldName = Exclude<keyof UpdateNestSettingsFormValues, 'visibility' | 'joinPolicy'>
type ParticipationFieldName = 'minThreadCreationLevel' | 'minCommentCreationLevel'

const PARTICIPATION_FIELDS: { name: ParticipationFieldName, label: string }[] = [
  { name: 'minThreadCreationLevel', label: 'Create threads' },
  { name: 'minCommentCreationLevel', label: 'Comment' }
]

const MANAGEMENT_FIELDS: { name: PermissionFieldName, label: string }[] = [
  { name: 'minNestEditLevel', label: 'Edit nest details' },
  { name: 'minThreadLockManageLevel', label: 'Lock/unlock threads' },
  { name: 'minThreadPinManageLevel', label: 'Pin/unpin threads' },
  { name: 'minCommentPinManageLevel', label: 'Pin/unpin comments' },
  { name: 'minContentModerateLevel', label: 'Moderate content' },
  { name: 'minMemberViewLevel', label: 'View member list' },
  { name: 'minInviteManageLevel', label: 'Manage invites' },
  { name: 'minMemberRemoveLevel', label: 'Remove members' },
  { name: 'minJoinRequestManageLevel', label: 'Manage join requests' },
  { name: 'minBanManageLevel', label: 'Manage bans' }
]

export function NestSettingsForm({ nestSlug, settings, readOnly }: NestSettingsFormProps) {
  const [confirmingPrivacy, setConfirmingPrivacy] = useState(false)

  const {
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: {
      isSubmitting,
      errors
    }
  } = useForm<UpdateNestSettingsFormValues>({
    resolver: zodResolver(updateNestSettingsSchema),
    defaultValues: settings
  })

  const visibility = watch('visibility') as NestSettingsUpdateDtoVisibility
  const isPrivate = visibility === NestSettingsUpdateDtoVisibility.PRIVATE

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

  const clampParticipationToMember = () => {
    for (const { name } of PARTICIPATION_FIELDS) {
      if (getValues(name) === NON_MEMBER_LEVEL) {
        setValue(name, MEMBER_LEVEL)
      }
    }
  }

  const handleVisibilityChange = (nextVisibility: NestSettingsUpdateDtoVisibility) => {
    const opensParticipationToNonMembers = PARTICIPATION_FIELDS.some(({ name }) => getValues(name) === NON_MEMBER_LEVEL)

    if (nextVisibility === NestSettingsUpdateDtoVisibility.PRIVATE && opensParticipationToNonMembers) {
      setConfirmingPrivacy(true)
      return
    }

    setValue('visibility', nextVisibility, { shouldDirty: true })
  }

  const renderLevelField = (name: PermissionFieldName, label: string, levels: number[]) => (
    <div key={name} className='flex items-center justify-between gap-4'>
      <label htmlFor={name} className='text-sm'>
        {label}
      </label>

      <Select
        id={name}
        value={watch(name) as number}
        onChange={(value) => setValue(name, value, { shouldDirty: true })}
        disabled={readOnly}
        options={levels.map((level) => ({ value: level, label: LEVEL_LABELS[level] }))}
        className='w-36'
      />
    </div>
  )

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4'>
        <h2 className='text-sm font-semibold'>General</h2>

        <div className='flex flex-col gap-1.5'>
          <label htmlFor='visibility' className='text-sm font-medium'>
            Visibility
          </label>

          <Select
            id='visibility'
            value={visibility}
            onChange={handleVisibilityChange}
            disabled={readOnly}
            options={[
              { value: NestSettingsUpdateDtoVisibility.PUBLIC, label: 'Public' },
              { value: NestSettingsUpdateDtoVisibility.PRIVATE, label: 'Private' }
            ]}
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <label htmlFor='joinPolicy' className='text-sm font-medium'>
            Join policy
          </label>

          <Select
            id='joinPolicy'
            value={watch('joinPolicy') as NestSettingsUpdateDtoJoinPolicy}
            onChange={(value) => setValue('joinPolicy', value, { shouldDirty: true })}
            disabled={readOnly}
            options={[
              { value: NestSettingsUpdateDtoJoinPolicy.OPEN, label: 'Open' },
              { value: NestSettingsUpdateDtoJoinPolicy.BY_REQUEST, label: 'By request' },
              { value: NestSettingsUpdateDtoJoinPolicy.BY_INVITE, label: 'By invite' }
            ]}
          />
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        <h2 className='text-sm font-semibold'>Permissions</h2>
        <p className='text-xs text-muted-foreground'>
          &quot;Anyone&quot; also lets people who aren&apos;t members participate — only available on public nests.
        </p>

        {PARTICIPATION_FIELDS.map(({ name, label }) =>
          renderLevelField(name, label, isPrivate ? MANAGEMENT_LEVELS : [NON_MEMBER_LEVEL, ...MANAGEMENT_LEVELS]))}
        {MANAGEMENT_FIELDS.map(({ name, label }) => renderLevelField(name, label, MANAGEMENT_LEVELS))}
        {renderLevelField('minActionLogViewLevel', 'View action log', ACTION_LOG_LEVELS)}
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

      <ConfirmDialog
        open={confirmingPrivacy}
        title='Make this nest private?'
        description={'Non-members won\'t be able to view a private nest, so "Create threads" and "Comment" will be raised to Member.'}
        confirmLabel='Make private'
        onCancel={() => {
          setValue('visibility', NestSettingsUpdateDtoVisibility.PUBLIC)
          setConfirmingPrivacy(false)
        }}
        onConfirm={() => {
          setValue('visibility', NestSettingsUpdateDtoVisibility.PRIVATE)
          clampParticipationToMember()
          setConfirmingPrivacy(false)
        }}
      />
    </form>
  )
}
