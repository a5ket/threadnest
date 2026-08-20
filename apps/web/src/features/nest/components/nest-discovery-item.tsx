import { JoinNestControl } from '@/features/nest/components/join-nest-control'
import type { NestDiscoveryItem as NestDiscoveryItemType } from '@/features/nest/nest.types'
import Link from 'next/link'

interface NestDiscoveryItemProps {
  nest: NestDiscoveryItemType
}

export function NestDiscoveryItem({ nest }: NestDiscoveryItemProps) {
  return (
    <li className='rounded-md border border-border p-3'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted'>
            {nest.iconUrl
              ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={nest.iconUrl} alt='' className='h-full w-full object-cover' />
                )
              : (
                  <span className='text-xs font-medium text-muted-foreground'>{nest.name.charAt(0).toUpperCase()}</span>
                )}
          </div>

          <div>
            <div className='flex items-center gap-2'>
              {nest.visibility === 'PRIVATE' && (
                <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                  Private
                </span>
              )}
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
