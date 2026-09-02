import { Badge } from '@/common/components/badge'
import { NestAvatar } from '@/common/components/nest-avatar'
import Link from 'next/link'

interface NestPaywallGateProps {
  nestSlug: string
  nestName: string
  nestIconUrl: string | null
  description: string | null
  memberCount: number | null
  threadCount: number | null
  priceAmountCents: number | null
}

export function NestPaywallGate({
  nestSlug,
  nestName,
  nestIconUrl,
  description,
  memberCount,
  threadCount,
  priceAmountCents
}: NestPaywallGateProps) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center'>
      <NestAvatar name={nestName} slug={nestSlug} iconUrl={nestIconUrl} size={56} />

      <div className='flex items-center gap-2'>
        <h1 className='text-lg font-semibold'>{nestName}</h1>
        <Badge variant='warning'>Paywalled</Badge>
      </div>

      {description && (
        <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>
      )}

      {(memberCount !== null || threadCount !== null) && (
        <div className='flex gap-2'>
          {memberCount !== null && (
            <div className='min-w-20 rounded-md bg-muted px-3 py-2 text-center'>
              <div className='text-base font-semibold'>{memberCount}</div>
              <div className='text-xs text-muted-foreground'>Members</div>
            </div>
          )}

          {threadCount !== null && (
            <div className='min-w-20 rounded-md bg-muted px-3 py-2 text-center'>
              <div className='text-base font-semibold'>{threadCount}</div>
              <div className='text-xs text-muted-foreground'>Threads</div>
            </div>
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
    </div>
  )
}
