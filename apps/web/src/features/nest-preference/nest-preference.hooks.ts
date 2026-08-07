'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { meNestPreferenceGet, meNestPreferenceUpdate } from '@/generated/api/me/me'
import { UserNestPreferenceUpdateDto } from '@/generated/api/models'
import { useQuery } from '@tanstack/react-query'

export function nestPreferenceQueryKey(nestSlug: string) {
  return ['me', 'nests', nestSlug, 'preferences']
}

export function useNestPreference(nestSlug: string, enabled: boolean) {
  return useQuery({
    queryKey: nestPreferenceQueryKey(nestSlug),
    queryFn: async () => {
      const result = await meNestPreferenceGet(nestSlug)
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data
    },
    enabled
  })
}

export const useUpdateNestPreference = createMutationHook(
  ({ nestSlug, ...dto }: { nestSlug: string } & UserNestPreferenceUpdateDto) => meNestPreferenceUpdate(nestSlug, dto),
  200
)
