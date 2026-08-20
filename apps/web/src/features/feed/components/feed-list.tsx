'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { ThreadSearchResultItem } from '@/features/thread/components/thread-search-result-item'
import Link from 'next/link'
import { useFeed } from '../feed.hooks'
import type { FeedPage } from '../feed.server'

interface FeedListProps {
  initialPage: FeedPage
}

export function FeedList({ initialPage }: FeedListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(initialPage)
  const threads = data.pages.flatMap((page) => page.items)

  return (
    <ul className='flex flex-col gap-3'>
      {threads.map((thread) => (
        <ThreadSearchResultItem key={thread.id} thread={thread} />
      ))}

      {threads.length === 0 && (
        <p className='py-6 text-center text-sm text-muted-foreground'>
          No posts yet. Join a nest to see its threads here —
          {' '}
          <Link href='/discover' className='text-primary hover:underline'>discover nests</Link>
          .
        </p>
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
