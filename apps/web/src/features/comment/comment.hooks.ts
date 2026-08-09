'use client'

import { createMutationHook } from '@/common/api-mutation'
import { CommentVoteDtoType } from '@/generated/api/models'
import { commentCreateReply, commentDelete, commentRemoveVote, commentUpdate, commentVote, nestThreadCommentCreate } from './comment.api'

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
