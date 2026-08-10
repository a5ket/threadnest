'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { nestList } from '@/features/nest/nest.api'
import { threadSearch } from '@/features/thread/thread.api'
import { userList } from '@/generated/api/users/users'
import { NestListSortBy } from '@/generated/api/models'
import { useQuery } from '@tanstack/react-query'

const RESULT_LIMIT = 5

export function useGlobalSearch(term: string) {
  const enabled = term.trim().length > 0

  const nests = useQuery({
    queryKey: ['search', 'nests', term],
    queryFn: async () => {
      const result = await nestList({ limit: RESULT_LIMIT, sortBy: NestListSortBy.createdAt, sortAscending: false, search: term })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data.items
    },
    enabled,
    staleTime: 10_000
  })

  const threads = useQuery({
    queryKey: ['search', 'threads', term],
    queryFn: async () => {
      const result = await threadSearch({ limit: RESULT_LIMIT, search: term })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data.items
    },
    enabled,
    staleTime: 10_000
  })

  const users = useQuery({
    queryKey: ['search', 'users', term],
    queryFn: async () => {
      const result = await userList({ limit: RESULT_LIMIT, search: term })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data.items
    },
    enabled,
    staleTime: 10_000
  })

  return {
    nests: nests.data ?? [],
    threads: threads.data ?? [],
    users: users.data ?? [],
    isLoading: enabled && (nests.isLoading || threads.isLoading || users.isLoading),
    hasResults: (nests.data?.length ?? 0) + (threads.data?.length ?? 0) + (users.data?.length ?? 0) > 0
  }
}
