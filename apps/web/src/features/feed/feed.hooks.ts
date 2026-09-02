'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { threadDiscover } from '@/features/thread/thread.api'
import { useInfiniteQuery } from '@tanstack/react-query'
import { meFeedList } from './feed.api'
import type { FeedPage } from './feed.server'

export const feedQueryKey = ['me', 'feed'] as const
export const discoverFeedQueryKey = ['threads', 'discover'] as const

export function useFeed(initialPage: FeedPage) {
  return useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const result = await meFeedList({ limit: 20, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}

export function useDiscoverFeed(initialPage: FeedPage) {
  return useInfiniteQuery({
    queryKey: discoverFeedQueryKey,
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const result = await threadDiscover({ limit: 20, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}
