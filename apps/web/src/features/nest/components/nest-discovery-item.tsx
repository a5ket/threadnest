import { Badge } from '@/common/components/badge'
import { NestAvatar } from '@/common/components/nest-avatar'
import { JoinNestControl } from '@/features/nest/components/join-nest-control'
import type { NestDiscoveryItem as NestDiscoveryItemType } from '@/features/nest/nest.types'
import Link from 'next/link'

interface NestDiscoveryItemProps {
  nest: NestDiscoveryItemType
}

export function NestDiscoveryItem({ nest }: NestDiscoveryItemProps) {
  return (
    <li className='rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-sm'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <NestAvatar name={nest.name} slug={nest.slug} iconUrl={nest.iconUrl} size={32} />

          <div>
            <div className='flex items-center gap-2'>
              {nest.visibility === 'PRIVATE' && <Badge>Private</Badge>}
              <Link href={`/n/${nest.slug}`} className='font-medium hover:underline'>
                {nest.name}
              </Link>
            </div>

            {nest.description && (
              <p className='text-sm text-muted-foreground'>{nest.description}</p>
            )}

            <p className='mt-1 text-xs text-muted-foreground'>
              {nest.memberCount}
              {' members · '}
              {nest.threadCount}
              {' threads'}
            </p>
          </div>
        </div>

        {nest.isMember && (
          <span className='text-sm text-muted-foreground'>Joined</span>
        )}

        {!nest.isMember && nest.hasPendingJoinRequest && (
          <span className='text-sm text-muted-foreground'>Request pending</span>
        )}

        {!nest.isMember && !nest.hasPendingJoinRequest && (
          <JoinNestControl nestSlug={nest.slug} nestName={nest.name} joinPolicy={nest.joinPolicy} />
        )}
      </div>
    </li>
  )
}
