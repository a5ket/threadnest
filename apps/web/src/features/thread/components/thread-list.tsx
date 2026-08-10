'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { useThreadList } from '@/features/thread/thread.hooks'
import type { ThreadListPage } from '@/features/thread/thread.server'
import type { NestThreadListSortBy } from '@/generated/api/models'
import { ThreadListItem } from './thread-list-item'

interface ThreadListProps {
  nestSlug: string
  sortBy: NestThreadListSortBy
  search?: string
  initialPage: ThreadListPage
}

export function ThreadList({ nestSlug, sortBy, search, initialPage }: ThreadListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useThreadList(nestSlug, sortBy, search, initialPage)
  const threads = data.pages.flatMap((page) => page.items)

  return (
    <ul className='flex flex-col gap-3 pb-6'>
      {threads.map((thread) => (
        <ThreadListItem key={thread.id} nestSlug={nestSlug} thread={thread} />
      ))}

      {threads.length === 0 && (
        <p className='text-sm text-muted-foreground'>{search ? 'No threads found.' : 'No threads yet.'}</p>
      )}

      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='text-center text-sm text-muted-foreground'>Loading more...</p>
      )}

      {!hasNextPage && !isFetchingNextPage && threads.length > 0 && (
        <p className='text-center text-sm text-muted-foreground'>{'You\'ve reached the end.'}</p>
      )}
    </ul>
  )
}
