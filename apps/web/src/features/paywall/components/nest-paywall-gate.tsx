import { Badge } from '@/common/components/badge'
import { NestAvatar } from '@/common/components/nest-avatar'
import { MembersIcon, ThreadsIcon } from '@/common/components/nest-stat-icons'
import { RecommendedNestItem } from '@/features/nest/components/recommended-nest-item'
import type { NestDiscoveryItem as NestDiscoveryItemType } from '@/features/nest/nest.types'
import Link from 'next/link'

interface NestPaywallGateProps {
  nestSlug: string
  nestName: string
  nestIconUrl: string | null
  description: string | null
  memberCount: number | null
  threadCount: number | null
  priceAmountCents: number | null
  recommendedNests: NestDiscoveryItemType[]
}

export function NestPaywallGate({
  nestSlug,
  nestName,
  nestIconUrl,
  description,
  memberCount,
  threadCount,
  priceAmountCents,
  recommendedNests
}: NestPaywallGateProps) {
  return (
    <div className='mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center'>
      <NestAvatar name={nestName} slug={nestSlug} iconUrl={nestIconUrl} size={72} />

      <div className='flex items-center gap-2'>
        <h1 className='text-lg font-semibold'>{nestName}</h1>
        <Badge variant='warning'>Paywalled</Badge>
      </div>

      {description && (
        <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>
      )}

      {(memberCount !== null || threadCount !== null) && (
        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
          {memberCount !== null && (
            <span className='flex items-center gap-1.5'>
              <MembersIcon />
              <span className='font-medium text-foreground'>{memberCount}</span>
              {' members'}
            </span>
          )}

          {threadCount !== null && (
            <span className='flex items-center gap-1.5'>
              <ThreadsIcon />
              <span className='font-medium text-foreground'>{threadCount}</span>
              {' threads'}
            </span>
          )}
        </div>
      )}

      <p className='max-w-sm text-sm text-muted-foreground'>
        {priceAmountCents !== null
          ? `Subscribe for $${(priceAmountCents / 100).toFixed(2)}/month to read and join the discussion.`
          : 'Subscribe to read and join the discussion.'}
      </p>

      <Link
        href={`/n/${nestSlug}/subscribe`}
        className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'
      >
        Subscribe
      </Link>

      {recommendedNests.length > 0 && (
        <div className='mt-6 flex w-full max-w-sm flex-col gap-2 text-left'>
          <h2 className='text-sm font-semibold text-foreground'>Other nests you might like</h2>

          <ul className='divide-y divide-divider'>
            {recommendedNests.map((nest) => (
              <RecommendedNestItem key={nest.slug} nest={nest} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
