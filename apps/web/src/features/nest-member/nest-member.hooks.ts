'use client'

import { createMutationHook } from '@/common/api-mutation'
import { NestMemberUpdateRoleDtoRole } from '@/generated/api/models'
import { nestMemberChangeRole, nestMemberRemove } from './nest-member.api'

export const useRemoveMember = createMutationHook(
  ({ nestSlug, userId }: { nestSlug: string, userId: string }) => nestMemberRemove(nestSlug, userId),
  204
)

export const useChangeMemberRole = createMutationHook(
  ({ nestSlug, userId, role }: { nestSlug: string, userId: string, role: NestMemberUpdateRoleDtoRole }) =>
    nestMemberChangeRole(nestSlug, userId, { role }),
  200
)
