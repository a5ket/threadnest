'use client'

import { Badge } from '@/common/components/badge'
import { NestAvatar } from '@/common/components/nest-avatar'
import { MembersIcon, ThreadsIcon } from '@/common/components/nest-stat-icons'
import { useSetRightRail } from '@/common/components/right-rail-context'
import { formatMonthYear } from '@/common/format-date'
import { NestAccessContextDtoVisibility } from '@/generated/api/models'

interface NestRightRailProps {
  name: string
  slug: string
  description?: string
  iconUrl?: string | null
  visibility?: NestAccessContextDtoVisibility
  memberCount?: number
  threadCount?: number
  createdAt?: string
}

export function NestRightRail({ name, slug, description, iconUrl, visibility, memberCount, threadCount, createdAt }: NestRightRailProps) {
  useSetRightRail(
    <div className='flex h-full flex-col gap-3 p-4'>
      <div className='flex items-center gap-2'>
        <NestAvatar name={name} slug={slug} iconUrl={iconUrl} size={28} />
        <h2 className='text-sm font-semibold text-foreground'>
          n/
          {slug}
        </h2>

        {visibility === NestAccessContextDtoVisibility.PRIVATE && <Badge>Private</Badge>}
      </div>

      {description && <p className='text-sm text-muted-foreground'>{description}</p>}

      {(memberCount !== undefined || threadCount !== undefined) && (
        <div className='flex flex-col gap-1.5 border-t border-border pt-3 text-sm text-muted-foreground'>
          {memberCount !== undefined && (
            <div className='flex items-center gap-2'>
              <MembersIcon />
              <span>
                <span className='font-medium text-foreground'>{memberCount}</span>
                {' members'}
              </span>
            </div>
          )}

          {threadCount !== undefined && (
            <div className='flex items-center gap-2'>
              <ThreadsIcon />
              <span>
                <span className='font-medium text-foreground'>{threadCount}</span>
                {' threads'}
              </span>
            </div>
          )}
        </div>
      )}

      {createdAt && (
        <p className='text-xs text-muted-foreground'>
          Created
          {' '}
          {formatMonthYear(createdAt)}
        </p>
      )}
    </div>
  )

  return null
}
