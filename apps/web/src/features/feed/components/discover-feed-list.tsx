'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { ThreadSearchResultItem } from '@/features/thread/components/thread-search-result-item'
import { useDiscoverFeed } from '../feed.hooks'
import type { FeedPage } from '../feed.server'

interface DiscoverFeedListProps {
  initialPage: FeedPage
}

export function DiscoverFeedList({ initialPage }: DiscoverFeedListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useDiscoverFeed(initialPage)
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
    </div>
  )
}
