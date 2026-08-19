'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { NestThreadListSortBy, ThreadCreateDto, ThreadUpdateDto, ThreadVoteDtoType } from '@/generated/api/models'
import { useInfiniteQuery } from '@tanstack/react-query'
import { nestThreadCreate, nestThreadDelete, nestThreadList, nestThreadLock, nestThreadPin, nestThreadRemoveVote, nestThreadSave, nestThreadUnlock, nestThreadUnpin, nestThreadUnsave, nestThreadUpdate, nestThreadVote } from './thread.api'
import type { ThreadListPage } from './thread.server'

export const useCreateThread = createMutationHook(
  ({ nestSlug, ...dto }: { nestSlug: string } & ThreadCreateDto) => nestThreadCreate(nestSlug, dto),
  201
)

export const useUpdateThread = createMutationHook(
  ({ nestSlug, threadSlug, ...dto }: { nestSlug: string, threadSlug: string } & ThreadUpdateDto) =>
    nestThreadUpdate(nestSlug, threadSlug, dto),
  200
)

export const useDeleteThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadDelete(nestSlug, threadSlug),
  204
)

export const useLockThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadLock(nestSlug, threadSlug),
  200
)

export const useUnlockThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadUnlock(nestSlug, threadSlug),
  200
)

export const usePinThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadPin(nestSlug, threadSlug),
  200
)

export const useUnpinThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadUnpin(nestSlug, threadSlug),
  200
)

export const useVoteThread = createMutationHook(
  ({ nestSlug, threadSlug, type }: { nestSlug: string, threadSlug: string, type: ThreadVoteDtoType }) =>
    nestThreadVote(nestSlug, threadSlug, { type }),
  200
)

export const useRemoveThreadVote = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadRemoveVote(nestSlug, threadSlug),
  200
)

export const useSaveThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadSave(nestSlug, threadSlug),
  200
)

export const useUnsaveThread = createMutationHook(
  ({ nestSlug, threadSlug }: { nestSlug: string, threadSlug: string }) =>
    nestThreadUnsave(nestSlug, threadSlug),
  200
)

export function threadListQueryKey(nestSlug: string, sortBy: NestThreadListSortBy, search: string | undefined) {
  return ['nests', nestSlug, 'threads', sortBy, search ?? '']
}

export function useThreadList(nestSlug: string, sortBy: NestThreadListSortBy, search: string | undefined, initialPage: ThreadListPage) {
  return useInfiniteQuery({
    queryKey: threadListQueryKey(nestSlug, sortBy, search),
    queryFn: async ({ pageParam }): Promise<ThreadListPage> => {
      const result = await nestThreadList(nestSlug, { limit: 20, sortBy, sortAscending: false, search, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}
