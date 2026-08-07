'use client'

import { Avatar } from '@/common/components/avatar'
import { formatDateTime } from '@/common/format-date'
import { getUserDisplayName } from '@/common/user-display-name'
import { useUserProfile } from '@/features/user/user.hooks'
import type { UserReferenceDto } from '@/generated/api/models'
import Link from 'next/link'
import { useRef, useState } from 'react'

interface UserLinkProps {
  user: UserReferenceDto | null
  className?: string
}

const HOVER_OPEN_DELAY_MS = 300

export function UserLink({ user, className }: UserLinkProps) {
  const [showPreview, setShowPreview] = useState(false)
  const openTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const username = user?.profile?.username ?? null

  const { data: preview, isLoading } = useUserProfile(username ?? '', showPreview && username !== null)

  if (!user) {
    return <span className={className}>[deleted]</span>
  }

  if (!user.profile) {
    return <span className={className}>{getUserDisplayName(user)}</span>
  }

  const handleMouseEnter = () => {
    openTimeout.current = setTimeout(() => setShowPreview(true), HOVER_OPEN_DELAY_MS)
  }

  const handleMouseLeave = () => {
    if (openTimeout.current) {
      clearTimeout(openTimeout.current)
      openTimeout.current = null
    }

    setShowPreview(false)
  }

  return (
    <span className='relative inline-block' onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link href={`/users/${user.profile.username}`} className={className ? `${className} hover:underline` : 'hover:underline'}>
        {getUserDisplayName(user)}
      </Link>

      {showPreview && (
        <span className='absolute left-0 top-full z-50 mt-2 block w-64 rounded-lg border border-border bg-background p-4 text-left shadow-lg'>
          {isLoading && <span className='block text-sm text-muted-foreground'>Loading...</span>}

          {preview && (
            <span className='flex flex-col gap-2'>
              <span className='flex items-center gap-3'>
                <Avatar avatarUrl={preview.avatarUrl} label={preview.displayName ?? preview.username} size={40} />

                <span className='flex flex-col'>
                  <span className='text-sm font-medium'>{preview.displayName ?? preview.username}</span>
                  <span className='text-xs text-muted-foreground'>
                    @
                    {preview.username}
                  </span>
                </span>
              </span>

              {preview.bio && <span className='block text-xs'>{preview.bio}</span>}

              <span className='block text-xs text-muted-foreground'>
                {'Joined '}
                {formatDateTime(preview.createdAt)}
              </span>
            </span>
          )}
        </span>
      )}
    </span>
  )
}
