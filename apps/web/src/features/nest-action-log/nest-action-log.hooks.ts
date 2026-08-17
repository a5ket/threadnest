'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { useInfiniteQuery } from '@tanstack/react-query'
import { nestActionLogList } from './nest-action-log.api'
import type { NestActionLogListPage } from './nest-action-log.server'

export function nestActionLogQueryKey(nestSlug: string) {
  return ['nests', nestSlug, 'action-logs']
}

export function useNestActionLogList(nestSlug: string, initialPage: NestActionLogListPage) {
  return useInfiniteQuery({
    queryKey: nestActionLogQueryKey(nestSlug),
    queryFn: async ({ pageParam }): Promise<NestActionLogListPage> => {
      const result = await nestActionLogList(nestSlug, { limit: 20, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}
