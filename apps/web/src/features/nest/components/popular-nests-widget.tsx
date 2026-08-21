import { NestAvatar } from '@/common/components/nest-avatar'
import Link from 'next/link'
import type { NestDiscoveryItem } from '../nest.types'

interface PopularNestsWidgetProps {
  nests: NestDiscoveryItem[]
}

export function PopularNestsWidget({ nests }: PopularNestsWidgetProps) {
  return (
    <div className='flex h-full flex-col gap-3 p-4'>
      <h2 className='text-sm font-semibold text-foreground'>About ThreadNest</h2>
      <p className='text-sm text-muted-foreground'>
        Create and join communities around shared interests.
      </p>

      {nests.length > 0 && (
        <div className='mt-2 flex flex-col gap-1 border-t border-border pt-3'>
          <h3 className='mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Popular nests</h3>

          {nests.map((nest) => (
            <Link
              key={nest.slug}
              href={`/n/${nest.slug}`}
              className='flex items-center gap-2 rounded-md p-1.5 hover:bg-muted'
            >
              <NestAvatar name={nest.name} slug={nest.slug} iconUrl={nest.iconUrl} size={28} />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{nest.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {nest.memberCount}
                  {' members'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link href='/discover' className='mt-1 text-sm text-primary hover:underline'>
        Discover more nests →
      </Link>
    </div>
  )
}
