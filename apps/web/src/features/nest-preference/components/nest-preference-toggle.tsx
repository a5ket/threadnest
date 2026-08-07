'use client'

import { nestPreferenceQueryKey, useNestPreference, useUpdateNestPreference } from '@/features/nest-preference/nest-preference.hooks'
import { useQueryClient } from '@tanstack/react-query'

interface NestPreferenceToggleProps {
  nestSlug: string
}

export function NestPreferenceToggle({ nestSlug }: NestPreferenceToggleProps) {
  const queryClient = useQueryClient()
  const { data: preference, isLoading } = useNestPreference(nestSlug, true)

  const updatePreference = useUpdateNestPreference({
    onSuccess: (updated) => {
      queryClient.setQueryData(nestPreferenceQueryKey(nestSlug), updated)
    }
  })

  if (isLoading || !preference) {
    return null
  }

  return (
    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
      <label className='flex items-center gap-1.5'>
        <input
          type='checkbox'
          checked={!preference.muted}
          disabled={updatePreference.isPending}
          onChange={(e) => updatePreference.mutate({ nestSlug, muted: !e.target.checked, allowInvites: preference.allowInvites })}
        />
        Notifications
      </label>

      <label className='flex items-center gap-1.5'>
        <input
          type='checkbox'
          checked={preference.allowInvites}
          disabled={updatePreference.isPending}
          onChange={(e) => updatePreference.mutate({ nestSlug, allowInvites: e.target.checked, muted: preference.muted })}
        />
        Allow invites
      </label>
    </div>
  )
}
