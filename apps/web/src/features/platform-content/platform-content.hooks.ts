'use client'

import { createMutationHook } from '@/common/api-mutation'
import { platformContentRemoveAllByUser, platformContentRemoveComment, platformContentRemoveThread } from './platform-content.api'

export const useRemoveThreadByPlatform = createMutationHook(
  (threadId: string) => platformContentRemoveThread(threadId),
  204
)

export const useRemoveCommentByPlatform = createMutationHook(
  (commentId: string) => platformContentRemoveComment(commentId),
  204
)

export const useRemoveAllContentByUser = createMutationHook(
  (userId: string) => platformContentRemoveAllByUser(userId),
  200
)
