'use client'

import { createMutationHook } from '@/common/api-mutation'
import { nestBanCreate, nestBanRevoke } from './nest-ban.api'

export const useBanUser = createMutationHook(
  ({ nestSlug, userId }: { nestSlug: string, userId: string }) => nestBanCreate(nestSlug, userId),
  201
)

export const useUnbanUser = createMutationHook(
  ({ nestSlug, userId }: { nestSlug: string, userId: string }) => nestBanRevoke(nestSlug, userId),
  204
)
