'use client'

import { Avatar } from '@/common/components/avatar'
import { formatDateTime } from '@/common/format-date'
import { EditProfileForm } from '@/features/me/components/edit-profile-form'
import { useUser } from '@/features/me/me.hooks'
import { RemoveAllContentButton } from '@/features/platform-content/components/remove-all-content-button'
import { PlatformRoleControl } from '@/features/platform-role-grant/components/platform-role-control'
import { SuspendUserControl } from '@/features/platform-suspension/components/suspend-user-control'
import type { UserProfileResponseDto } from '@/generated/api/models'
import { useState } from 'react'

interface UserProfileViewProps {
  profile: UserProfileResponseDto
}

export function UserProfileView({ profile: initialProfile }: UserProfileViewProps) {
  const currentUser = useUser()
  const [profile, setProfile] = useState(initialProfile)
  const [editing, setEditing] = useState(false)

  const isOwnProfile = currentUser?.username === profile.username

  if (editing) {
    return (
      <div className='flex flex-col gap-6 p-6'>
        <h1 className='text-lg font-semibold'>Edit profile</h1>

        <EditProfileForm
          profile={profile}
          onSaved={(updated) => {
            setProfile(updated)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <Avatar avatarUrl={profile.avatarUrl} label={profile.displayName ?? profile.username} size={64} />

          <div>
            <h1 className='text-lg font-semibold'>{profile.displayName ?? profile.username}</h1>
            <p className='text-sm text-muted-foreground'>
              @
              {profile.username}
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <button
            type='button'
            onClick={() => setEditing(true)}
            className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted'
          >
            Edit profile
          </button>
        )}
      </div>

      {profile.bio && (
        <p className='max-w-prose whitespace-pre-wrap text-sm'>{profile.bio}</p>
      )}

      <p className='text-xs text-muted-foreground'>
        Joined
        {' '}
        {formatDateTime(profile.createdAt)}
      </p>

      {!isOwnProfile && currentUser?.platformAccess.isModerator && (
        <div className='flex flex-col gap-4 rounded-md border border-border p-4'>
          <h2 className='text-sm font-semibold'>Platform moderation</h2>

          <SuspendUserControl userId={profile.userId} />
          <RemoveAllContentButton userId={profile.userId} />

          {currentUser.platformAccess.isAdmin && (
            <PlatformRoleControl userId={profile.userId} />
          )}
        </div>
      )}
    </div>
  )
}
