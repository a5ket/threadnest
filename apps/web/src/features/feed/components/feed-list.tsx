'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { ThreadSearchResultItem } from '@/features/thread/components/thread-search-result-item'
import { useFeed } from '../feed.hooks'
import type { FeedPage } from '../feed.server'

interface FeedListProps {
  initialPage: FeedPage
}

export function FeedList({ initialPage }: FeedListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(initialPage)
  const threads = data.pages.flatMap((page) => page.items)

  return (
    <div className='flex flex-col gap-3'>
      <ul className='divide-y divide-divider'>
        {threads.map((thread) => (
          <ThreadSearchResultItem key={thread.id} thread={thread} />
        ))}
      </ul>

      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='py-4 text-center text-sm text-muted-foreground'>Loading more...</p>
      )}

      {!hasNextPage && !isFetchingNextPage && threads.length > 0 && (
        <p className='py-4 text-center text-sm text-muted-foreground'>{'You\'ve reached the end.'}</p>
      )}
    </div>
  )
}
