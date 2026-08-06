'use client'

import { ApiError } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { useIsSignedIn } from '@/features/me/me.hooks'
import { useQuery } from '@tanstack/react-query'
import { meBlockCreate, meBlockDelete, meBlockList } from './block.api'

export const blockedUsersQueryKey = ['me', 'blocks']

export function useBlockedUsers() {
  const isSignedIn = useIsSignedIn()

  return useQuery({
    queryKey: blockedUsersQueryKey,
    queryFn: async () => {
      const result = await meBlockList()
      if (result.status !== 200) throw ApiError.fromComposite(result)
      return result.data.data
    },
    enabled: isSignedIn
  })
}

export function useIsBlocked(userId: string) {
  const { data } = useBlockedUsers()
  return data?.some((block) => block.user.id === userId) ?? false
}

export const useBlockUser = createMutationHook(
  (blockedId: string) => meBlockCreate(blockedId),
  201
)

export const useUnblockUser = createMutationHook(
  (blockedId: string) => meBlockDelete(blockedId),
  204
)
