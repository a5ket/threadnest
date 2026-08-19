'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { ThreadSearchResultItem } from '@/features/thread/components/thread-search-result-item'
import { useSavedThreadList } from '../saved-thread.hooks'
import type { SavedThreadListPage } from '../saved-thread.server'

interface SavedThreadListProps {
  initialPage: SavedThreadListPage
}

export function SavedThreadList({ initialPage }: SavedThreadListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSavedThreadList(initialPage)
  const threads = data.pages.flatMap((page) => page.items)

  return (
    <ul className='flex flex-col gap-3'>
      {threads.map((thread) => (
        <ThreadSearchResultItem key={thread.id} thread={thread} />
      ))}

      {threads.length === 0 && (
        <p className='py-6 text-center text-sm text-muted-foreground'>No saved threads yet.</p>
      )}

      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='py-4 text-center text-sm text-muted-foreground'>Loading more...</p>
      )}

      {!hasNextPage && !isFetchingNextPage && threads.length > 0 && (
        <p className='py-4 text-center text-sm text-muted-foreground'>{'You\'ve reached the end.'}</p>
      )}
    </ul>
  )
}
