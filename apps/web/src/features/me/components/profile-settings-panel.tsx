'use client'

import { EditProfileForm } from '@/features/me/components/edit-profile-form'
import type { UserProfileResponseDto } from '@/generated/api/models'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ProfileSettingsPanelProps {
  profile: UserProfileResponseDto
}

export function ProfileSettingsPanel({ profile: initialProfile }: ProfileSettingsPanelProps) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)

  return (
    <EditProfileForm
      profile={profile}
      onSaved={(updated) => {
        setProfile(updated)
        router.refresh()
      }}
      onCancel={() => router.push(`/users/${profile.username}`)}
    />
  )
}
