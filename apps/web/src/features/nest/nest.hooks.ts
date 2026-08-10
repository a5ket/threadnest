'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { NestListSortBy } from '@/generated/api/models'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { nestCreate, nestDelete, nestList, nestTransferOwnership } from './nest.api'
import type { NestListPage } from './nest.server'

export const useCreateNest = createMutationHook(nestCreate, 201)
export const useDeleteNest = createMutationHook(nestDelete, 204)

export const useTransferOwnership = createMutationHook(
  ({ nestSlug, userId }: { nestSlug: string, userId: string }) => nestTransferOwnership(nestSlug, { userId }),
  204
)

export function nestListQueryKeyPrefix() {
  return ['nests', 'discover']
}

export function nestListQueryKey(sortBy: NestListSortBy, search: string | undefined) {
  return [...nestListQueryKeyPrefix(), sortBy, search ?? '']
}

/** Invalidates every sort/search variant of the discovery list, so join/leave actions refetch isMember/hasPendingJoinRequest. */
export function useInvalidateNestList() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: nestListQueryKeyPrefix() })
}

export function useNestList(sortBy: NestListSortBy, search: string | undefined, initialPage: NestListPage) {
  return useInfiniteQuery({
    queryKey: nestListQueryKey(sortBy, search),
    queryFn: async ({ pageParam }): Promise<NestListPage> => {
      const result = await nestList({ limit: 20, sortBy, sortAscending: false, search, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}
