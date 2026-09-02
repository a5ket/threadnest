import { NestAvatar } from '@/common/components/nest-avatar'
import type { NestDiscoveryItem } from '@/features/nest/nest.types'
import Link from 'next/link'

interface RecommendedNestItemProps {
  nest: NestDiscoveryItem
}

export function RecommendedNestItem({ nest }: RecommendedNestItemProps) {
  return (
    <li>
      <Link href={`/n/${nest.slug}`} className='flex items-center gap-3 p-2 transition-colors hover:bg-muted/50'>
        <NestAvatar name={nest.name} slug={nest.slug} iconUrl={nest.iconUrl} size={28} />

        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium'>{nest.name}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {nest.memberCount}
            {' members'}
          </p>
        </div>
      </Link>
    </li>
  )
}
