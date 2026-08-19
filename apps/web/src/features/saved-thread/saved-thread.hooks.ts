'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { useInfiniteQuery } from '@tanstack/react-query'
import { meSavedThreadList } from './saved-thread.api'
import type { SavedThreadListPage } from './saved-thread.server'

export const savedThreadListQueryKey = ['me', 'saved-threads'] as const

export function useSavedThreadList(initialPage: SavedThreadListPage) {
  return useInfiniteQuery({
    queryKey: savedThreadListQueryKey,
    queryFn: async ({ pageParam }): Promise<SavedThreadListPage> => {
      const result = await meSavedThreadList({ limit: 20, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}
