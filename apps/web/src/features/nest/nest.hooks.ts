'use client'

import { createMutationHook } from '@/common/api-mutation'
import { nestCreate, nestDelete, nestTransferOwnership } from './nest.api'

export const useCreateNest = createMutationHook(nestCreate, 201)
export const useDeleteNest = createMutationHook(nestDelete, 204)

export const useTransferOwnership = createMutationHook(
  ({ nestSlug, userId }: { nestSlug: string, userId: string }) => nestTransferOwnership(nestSlug, { userId }),
  204
)
