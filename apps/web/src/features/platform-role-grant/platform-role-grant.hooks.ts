'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { PlatformRoleGrantCreateDtoRole } from '@/generated/api/models'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { platformRoleGrantChange, platformRoleGrantCreate, platformRoleGrantGetActive, platformRoleGrantRevoke } from './platform-role-grant.api'

export function platformRoleGrantQueryKey(userId: string) {
  return ['platform', 'roles', userId]
}

export function useActivePlatformRole(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: platformRoleGrantQueryKey(userId),
    queryFn: async () => {
      const result = await platformRoleGrantGetActive(userId)
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data
    },
    enabled
  })
}

export const useGrantPlatformRole = createMutationHook(
  ({ userId, role }: { userId: string, role: PlatformRoleGrantCreateDtoRole }) => platformRoleGrantCreate(userId, { role }),
  201
)

export const useChangePlatformRole = createMutationHook(
  ({ userId, role }: { userId: string, role: PlatformRoleGrantCreateDtoRole }) => platformRoleGrantChange(userId, { role }),
  200
)

export const useRevokePlatformRole = createMutationHook(
  ({ userId }: { userId: string }) => platformRoleGrantRevoke(userId),
  204
)

export function useInvalidateActivePlatformRole(userId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: platformRoleGrantQueryKey(userId) })
}
