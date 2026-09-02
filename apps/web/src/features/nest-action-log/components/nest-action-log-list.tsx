'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { useNestActionLogList } from '../nest-action-log.hooks'
import type { NestActionLogListPage } from '../nest-action-log.server'
import { NestActionLogItem } from './nest-action-log-item'

interface NestActionLogListProps {
  nestSlug: string
  initialPage: NestActionLogListPage
}

export function NestActionLogList({ nestSlug, initialPage }: NestActionLogListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNestActionLogList(nestSlug, initialPage)
  const logs = data.pages.flatMap((page) => page.items)

  return (
    <ul className='flex flex-col divide-y divide-divider rounded-lg border border-border bg-card'>
      {logs.map((log) => (
        <NestActionLogItem key={log.id} log={log} nestSlug={nestSlug} />
      ))}

      {logs.length === 0 && (
        <p className='py-6 text-center text-sm text-muted-foreground'>No actions logged yet.</p>
      )}

      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='py-4 text-center text-sm text-muted-foreground'>Loading more...</p>
      )}

      {!hasNextPage && !isFetchingNextPage && logs.length > 0 && (
        <p className='py-4 text-center text-sm text-muted-foreground'>{'You\'ve reached the end.'}</p>
      )}
    </ul>
  )
}
