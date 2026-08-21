'use client'

import { nestPreferenceQueryKey, useNestPreference, useUpdateNestPreference } from '@/features/nest-preference/nest-preference.hooks'
import { useQueryClient } from '@tanstack/react-query'

interface NestPreferenceToggleProps {
  nestSlug: string
}

function BellIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-4 w-4'>
      <path d='M4 8a6 6 0 0 1 12 0c0 4 1.5 5 1.5 5h-15S4 12 4 8Z' strokeLinejoin='round' />
      <path d='M8 16a2 2 0 0 0 4 0' strokeLinecap='round' />
      {muted && <path d='M3 3l14 14' strokeLinecap='round' />}
    </svg>
  )
}

function InviteIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-4 w-4'>
      <rect x='3' y='5' width='14' height='10' rx='2' />
      <path d='M3 6l7 5 7-5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
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
    <div className='flex items-center gap-1'>
      <button
        type='button'
        aria-label={preference.muted ? 'Enable notifications for this nest' : 'Mute notifications for this nest'}
        aria-pressed={!preference.muted}
        disabled={updatePreference.isPending}
        onClick={() => updatePreference.mutate({ nestSlug, muted: !preference.muted, allowInvites: preference.allowInvites })}
        className={`rounded-md p-2 hover:bg-muted disabled:opacity-50 ${preference.muted ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        <BellIcon muted={preference.muted} />
      </button>

      <button
        type='button'
        aria-label={preference.allowInvites ? 'Stop allowing invites from this nest' : 'Allow invites from this nest'}
        aria-pressed={preference.allowInvites}
        disabled={updatePreference.isPending}
        onClick={() => updatePreference.mutate({ nestSlug, allowInvites: !preference.allowInvites, muted: preference.muted })}
        className={`rounded-md p-2 hover:bg-muted disabled:opacity-50 ${preference.allowInvites ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        <InviteIcon />
      </button>
    </div>
  )
}
