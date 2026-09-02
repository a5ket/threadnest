'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { usePlatformActionLogList } from '../platform-action-log.hooks'
import type { PlatformActionLogListPage } from '../platform-action-log.server'
import type { PlatformActionLogFilters } from '../platform-action-log.types'
import { PlatformActionLogItem } from './platform-action-log-item'

interface PlatformActionLogListProps {
  filters: PlatformActionLogFilters
  initialPage: PlatformActionLogListPage
}

export function PlatformActionLogList({ filters, initialPage }: PlatformActionLogListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePlatformActionLogList(filters, initialPage)
  const logs = data.pages.flatMap((page) => page.items)

  return (
    <ul className='flex flex-col divide-y divide-divider rounded-lg border border-border bg-card'>
      {logs.map((log) => (
        <PlatformActionLogItem key={log.id} log={log} />
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
