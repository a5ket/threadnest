'use client'

import { Avatar } from '@/common/components/avatar'
import { formatMonthYear } from '@/common/format-date'
import { StartChatButton } from '@/features/chat/components/start-chat-button'
import { useUser } from '@/features/me/me.hooks'
import { RemoveAllContentButton } from '@/features/platform-content/components/remove-all-content-button'
import { PlatformRoleControl } from '@/features/platform-role-grant/components/platform-role-control'
import { SuspendUserControl } from '@/features/platform-suspension/components/suspend-user-control'
import { UserActivityList } from './user-activity-list'
import type { UserActivityPage } from '../user-activity.server'
import type { UserProfileResponseDto } from '@/generated/api/models'
import Link from 'next/link'

interface UserProfileViewProps {
  profile: UserProfileResponseDto
  initialActivity: UserActivityPage | null
}

export function UserProfileView({ profile, initialActivity }: UserProfileViewProps) {
  const currentUser = useUser()
  const isOwnProfile = currentUser?.username === profile.username

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

        {isOwnProfile
          ? (
              <Link
                href='/me/profile'
                className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted'
              >
                Edit profile
              </Link>
            )
          : (
              currentUser && <StartChatButton userId={profile.userId} />
            )}
      </div>

      {profile.bio && (
        <p className='max-w-prose whitespace-pre-wrap text-sm'>{profile.bio}</p>
      )}

      <p className='text-xs text-muted-foreground'>
        Joined
        {' '}
        {formatMonthYear(profile.createdAt)}
      </p>

      {initialActivity
        ? <UserActivityList username={profile.username} initialPage={initialActivity} />
        : <p className='text-sm text-muted-foreground'>This user has chosen to keep their activity private.</p>}

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
