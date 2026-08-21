'use client'

import { createMutationHook } from '@/common/api-mutation'
import { mePreferenceUpdate } from '@/generated/api/me/me'
import { UserPreferenceUpdateDto } from '@/generated/api/models'

export const useUpdatePreferences = createMutationHook(
  (dto: UserPreferenceUpdateDto) => mePreferenceUpdate(dto),
  200
)
