'use client'

import { createMutationHook } from '@/common/api-mutation'
import { commentCreateReply, nestThreadCommentCreate } from './comment.api'

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
