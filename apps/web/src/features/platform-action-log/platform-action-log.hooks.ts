'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { useInfiniteQuery } from '@tanstack/react-query'
import { platformActionLogList } from './platform-action-log.api'
import type { PlatformActionLogListPage } from './platform-action-log.server'
import type { PlatformActionLogFilters } from './platform-action-log.types'

export function platformActionLogQueryKey(filters: PlatformActionLogFilters) {
  return ['platform', 'action-logs', filters]
}

export function usePlatformActionLogList(filters: PlatformActionLogFilters, initialPage: PlatformActionLogListPage) {
  return useInfiniteQuery({
    queryKey: platformActionLogQueryKey(filters),
    queryFn: async ({ pageParam }): Promise<PlatformActionLogListPage> => {
      const result = await platformActionLogList({ limit: 20, ...filters, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}
