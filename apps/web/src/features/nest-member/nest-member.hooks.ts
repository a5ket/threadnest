'use client'

import { createMutationHook } from '@/common/api-mutation'
import { NestMemberUpdateRoleDtoRole } from '@/generated/api/models'
import { nestMemberChangeRole, nestMemberJoin, nestMemberRemove } from './nest-member.api'

export const useJoinNest = createMutationHook(
  (nestSlug: string) => nestMemberJoin(nestSlug),
  201
)

export const useRemoveMember = createMutationHook(
  ({ nestSlug, userId }: { nestSlug: string, userId: string }) => nestMemberRemove(nestSlug, userId),
  204
)

export const useChangeMemberRole = createMutationHook(
  ({ nestSlug, userId, role }: { nestSlug: string, userId: string, role: NestMemberUpdateRoleDtoRole }) =>
    nestMemberChangeRole(nestSlug, userId, { role }),
  200
)
