'use client'

import { Switch } from '@/common/components/switch'
import { useState } from 'react'
import { useUpdatePreferences } from '../user-preference.hooks'
import type { UserPreference } from '../user-preference.types'

interface PreferenceSettingsPanelProps {
  initialPreference: UserPreference
}

export function PreferenceSettingsPanel({ initialPreference }: PreferenceSettingsPanelProps) {
  const [preference, setPreference] = useState(initialPreference)

  const updatePreferences = useUpdatePreferences({
    onSuccess: (updated) => setPreference(updated)
  })

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4'>
        <div>
          <p className='text-sm font-medium'>Show activity on profile</p>
          <p className='text-sm text-muted-foreground'>Let other people see the threads and comments you&apos;ve posted, on your profile.</p>
        </div>

        <Switch
          checked={preference.showActivityOnProfile}
          disabled={updatePreferences.isPending}
          label='Show activity on profile'
          onChange={(showActivityOnProfile) => updatePreferences.mutate({ showActivityOnProfile })}
        />
      </div>
    </div>
  )
}
