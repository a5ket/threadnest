'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { notificationQueryKeys, useMarkNotificationsSeen, useNotificationList } from '../notification.hooks'
import type { NotificationListPage } from '../notification.server'
import { NotificationItem } from './notification-item'

interface NotificationListProps {
  unreadOnly: boolean
  initialPage: NotificationListPage
}

export function NotificationList({ unreadOnly, initialPage }: NotificationListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationList(unreadOnly, initialPage)
  const notifications = data.pages.flatMap((page) => page.items)

  const queryClient = useQueryClient()
  const markSeen = useMarkNotificationsSeen({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unseenCount })
  })

  // Viewing the notifications page clears the unseen badge, independent of whether items get read.
  useEffect(() => {
    markSeen.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ul className='flex flex-col divide-y divide-border rounded-md border border-border'>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}

      {notifications.length === 0 && (
        <p className='py-6 text-center text-sm text-muted-foreground'>
          {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
        </p>
      )}

      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='py-4 text-center text-sm text-muted-foreground'>Loading more...</p>
      )}

      {!hasNextPage && !isFetchingNextPage && notifications.length > 0 && (
        <p className='py-4 text-center text-sm text-muted-foreground'>{'You\'ve reached the end.'}</p>
      )}
    </ul>
  )
}
