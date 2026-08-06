'use client'

import { createMutationHook } from '@/common/api-mutation'
import { nestJoinRequestApprove, nestJoinRequestCreate, nestJoinRequestReject } from './join-request.api'

export const useCreateJoinRequest = createMutationHook(
  (nestSlug: string) => nestJoinRequestCreate(nestSlug),
  201
)

export const useApproveJoinRequest = createMutationHook(
  ({ nestSlug, requestId }: { nestSlug: string, requestId: string }) => nestJoinRequestApprove(nestSlug, requestId),
  204
)

export const useRejectJoinRequest = createMutationHook(
  ({ nestSlug, requestId }: { nestSlug: string, requestId: string }) => nestJoinRequestReject(nestSlug, requestId),
  204
)
