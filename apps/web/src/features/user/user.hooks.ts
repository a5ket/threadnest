'use client'

import { ApiError } from '@/common/api-error'
import { userGetByUsername } from '@/generated/api/users/users'
import { useQuery } from '@tanstack/react-query'

export function useUserProfile(username: string, enabled: boolean) {
  return useQuery({
    queryKey: ['users', username, 'profile'],
    queryFn: async () => {
      const result = await userGetByUsername(username)
      if (result.status !== 200) throw ApiError.fromComposite(result)
      return result.data.data
    },
    enabled,
    staleTime: 60_000
  })
}
