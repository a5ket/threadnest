'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userSuspensionCreate, userSuspensionGetActive, userSuspensionRevoke } from './platform-suspension.api'

export function userSuspensionQueryKey(userId: string) {
  return ['platform', 'suspensions', userId]
}

export function useUserSuspensionStatus(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: userSuspensionQueryKey(userId),
    queryFn: async () => {
      const result = await userSuspensionGetActive(userId)
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data
    },
    enabled
  })
}

export const useSuspendUser = createMutationHook(
  ({ userId, reason }: { userId: string, reason: string }) => userSuspensionCreate(userId, { reason }),
  201
)

export const useUnsuspendUser = createMutationHook(
  ({ userId }: { userId: string }) => userSuspensionRevoke(userId),
  204
)

export function useInvalidateUserSuspensionStatus(userId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: userSuspensionQueryKey(userId) })
}
