'use client'

import { createMutationHook } from '@/common/api-mutation'
import { nestInviteCreate, nestInviteRevoke } from './invite.api'

export const useCreateInvite = createMutationHook(
  ({ nestSlug, userId }: { nestSlug: string, userId: string }) => nestInviteCreate(nestSlug, { userId }),
  201
)

export const useRevokeInvite = createMutationHook(
  ({ nestSlug, inviteId }: { nestSlug: string, inviteId: string }) => nestInviteRevoke(nestSlug, inviteId),
  204
)
