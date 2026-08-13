'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook, createVoidMutationHook } from '@/common/api-mutation'
import { useIsSignedIn } from '@/features/me/me.hooks'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { meNotificationList, meNotificationMarkAllRead, meNotificationMarkRead, meNotificationMarkSeen, meNotificationUnseenCount } from './notification.api'
import type { NotificationListPage } from './notification.server'

export const notificationQueryKeys = {
  all: ['me', 'notifications'] as const,
  list: (unreadOnly: boolean) => ['me', 'notifications', 'list', unreadOnly] as const,
  recent: ['me', 'notifications', 'recent'] as const,
  unseenCount: ['me', 'notifications', 'unseen-count'] as const
}

const RECENT_LIMIT = 10
const UNSEEN_COUNT_POLL_MS = 30_000

export function useNotificationList(unreadOnly: boolean, initialPage: NotificationListPage) {
  return useInfiniteQuery({
    queryKey: notificationQueryKeys.list(unreadOnly),
    queryFn: async ({ pageParam }): Promise<NotificationListPage> => {
      const result = await meNotificationList({ limit: 20, unreadOnly, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}

export function useRecentNotifications(enabled: boolean) {
  const isSignedIn = useIsSignedIn()

  return useQuery({
    queryKey: notificationQueryKeys.recent,
    queryFn: async () => {
      const result = await meNotificationList({ limit: RECENT_LIMIT, unreadOnly: false })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data.items
    },
    enabled: enabled && isSignedIn
  })
}

export function useUnseenNotificationCount() {
  const isSignedIn = useIsSignedIn()

  return useQuery({
    queryKey: notificationQueryKeys.unseenCount,
    queryFn: async () => {
      const result = await meNotificationUnseenCount()
      if (result.status !== 200) throw ApiError.fromComposite(result)
      return result.data.data.count
    },
    enabled: isSignedIn,
    refetchInterval: UNSEEN_COUNT_POLL_MS
  })
}

export const useMarkNotificationRead = createMutationHook(
  (notificationId: string) => meNotificationMarkRead(notificationId),
  204
)

export const useMarkAllNotificationsRead = createVoidMutationHook(
  meNotificationMarkAllRead,
  204
)

export const useMarkNotificationsSeen = createVoidMutationHook(
  meNotificationMarkSeen,
  204
)
