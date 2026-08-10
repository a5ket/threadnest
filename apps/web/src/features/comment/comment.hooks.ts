'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { CommentVoteDtoType, NestThreadCommentListSortBy } from '@/generated/api/models'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { commentCreateReply, commentDelete, commentRemoveVote, commentUpdate, commentVote, nestThreadCommentCreate, nestThreadCommentList } from './comment.api'
import type { CommentTreePage } from './comment.types'

export const useCreateThreadComment = createMutationHook(
  ({ nestSlug, threadSlug, content }: { nestSlug: string, threadSlug: string, content: string }) =>
    nestThreadCommentCreate(nestSlug, threadSlug, { content }),
  201
)

export const useReplyToComment = createMutationHook(
  ({ commentId, content }: { commentId: string, content: string }) =>
    commentCreateReply(commentId, { content }),
  201
)

export const useUpdateComment = createMutationHook(
  ({ commentId, content }: { commentId: string, content: string }) =>
    commentUpdate(commentId, { content }),
  200
)

export const useDeleteComment = createMutationHook(
  ({ commentId }: { commentId: string }) => commentDelete(commentId),
  204
)

export const useVoteComment = createMutationHook(
  ({ commentId, type }: { commentId: string, type: CommentVoteDtoType }) =>
    commentVote(commentId, { type }),
  200
)

export const useRemoveCommentVote = createMutationHook(
  ({ commentId }: { commentId: string }) => commentRemoveVote(commentId),
  200
)

export function commentTreeQueryKeyPrefix(nestSlug: string, threadSlug: string) {
  return ['nests', nestSlug, 'threads', threadSlug, 'comments']
}

export function commentTreeQueryKey(nestSlug: string, threadSlug: string, sortBy: NestThreadCommentListSortBy) {
  return [...commentTreeQueryKeyPrefix(nestSlug, threadSlug), sortBy]
}

/** Invalidates every sort variant of this thread's comment tree, so any create/edit/delete/vote refetches the visible list. */
export function useInvalidateCommentTree(nestSlug: string, threadSlug: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: commentTreeQueryKeyPrefix(nestSlug, threadSlug) })
}

export function useCommentTree(
  nestSlug: string,
  threadSlug: string,
  sortBy: NestThreadCommentListSortBy,
  initialPage: CommentTreePage
) {
  return useInfiniteQuery({
    queryKey: commentTreeQueryKey(nestSlug, threadSlug, sortBy),
    queryFn: async ({ pageParam }): Promise<CommentTreePage> => {
      const result = await nestThreadCommentList(nestSlug, threadSlug, {
        limit: 20,
        replyLimit: 5,
        maxDepth: 3,
        sortBy,
        sortAscending: sortBy === NestThreadCommentListSortBy.score ? false : true,
        cursor: pageParam ?? undefined
      })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] }
  })
}
