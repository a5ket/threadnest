'use client'

import { NestAvatar } from '@/common/components/nest-avatar'
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

        {visibility === NestAccessContextDtoVisibility.PRIVATE && (
          <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
            Private
          </span>
        )}
      </div>

      {description && <p className='text-sm text-muted-foreground'>{description}</p>}

      {(memberCount !== undefined || threadCount !== undefined) && (
        <div className='flex gap-2 border-t border-border pt-3'>
          {memberCount !== undefined && (
            <div className='flex-1 rounded-md bg-muted p-2 text-center'>
              <div className='text-base font-semibold'>{memberCount}</div>
              <div className='text-xs text-muted-foreground'>Members</div>
            </div>
          )}

          {threadCount !== undefined && (
            <div className='flex-1 rounded-md bg-muted p-2 text-center'>
              <div className='text-base font-semibold'>{threadCount}</div>
              <div className='text-xs text-muted-foreground'>Threads</div>
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
