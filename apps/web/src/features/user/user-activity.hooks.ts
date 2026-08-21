'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { useInfiniteQuery } from '@tanstack/react-query'
import { userActivityList } from '@/generated/api/users/users'
import type { UserActivityPage } from './user-activity.server'

export function useUserActivity(username: string, initialPage: UserActivityPage) {
  return useInfiniteQuery({
    queryKey: ['users', username, 'activity'],
    queryFn: async ({ pageParam }): Promise<UserActivityPage> => {
      const result = await userActivityList(username, { limit: 20, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}
