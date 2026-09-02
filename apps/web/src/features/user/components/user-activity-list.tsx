'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { ThreadSearchResultItem } from '@/features/thread/components/thread-search-result-item'
import { UserActivityItemResponseDtoType } from '@/generated/api/models'
import { useUserActivity } from '../user-activity.hooks'
import type { UserActivityPage } from '../user-activity.server'
import { UserActivityCommentItem } from './user-activity-comment-item'

interface UserActivityListProps {
  username: string
  initialPage: UserActivityPage
}

export function UserActivityList({ username, initialPage }: UserActivityListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserActivity(username, initialPage)
  const items = data.pages.flatMap((page) => page.items)

  return (
    <div className='flex flex-col gap-3'>
      <ul className='divide-y divide-divider'>
        {items.map((item) => (
          item.type === UserActivityItemResponseDtoType.THREAD && item.thread
            ? <ThreadSearchResultItem key={`thread-${item.thread.id}`} thread={item.thread} />
            : item.comment && <UserActivityCommentItem key={`comment-${item.comment.id}`} comment={item.comment} />
        ))}
      </ul>

      {items.length === 0 && (
        <p className='py-6 text-center text-sm text-muted-foreground'>No activity yet.</p>
      )}

      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='py-4 text-center text-sm text-muted-foreground'>Loading more...</p>
      )}
    </div>
  )
}
