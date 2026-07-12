import { Injectable } from '@nestjs/common'
import { NestMemberRole, NestVisibility } from 'generated/prisma/enums'
import { NestBanRepository } from './ban/nest-ban.repository'
import { NEST_ACCESS_LEVEL } from './constants/nest-access-level'
import { NestNotFoundException } from './exceptions/nest-not-found.exception'
import { NestMemberRepository } from './member/nest-member.repository'
import { NestSettingsRepository } from './settings/nest-settings.repository'
import { NestAccessContext } from './types/nest.access-context'

@Injectable()
export class NestAccess {
  constructor(
    private readonly settingsRepo: NestSettingsRepository,
    private readonly bansRepo: NestBanRepository,
    private readonly membersRepo: NestMemberRepository
  ) { }

  private hasMinRole(
    role: NestMemberRole | null,
    minRole: NestMemberRole
  ) {
    return role !== null && NEST_ACCESS_LEVEL[role] >= NEST_ACCESS_LEVEL[minRole]
  }

  isHigherRole(actorRole: NestMemberRole, targetRole: NestMemberRole) {
    return NEST_ACCESS_LEVEL[actorRole] > NEST_ACCESS_LEVEL[targetRole]
  }

  isSameOrHigherRole(actorRole: NestMemberRole, targetRole: NestMemberRole) {
    return NEST_ACCESS_LEVEL[actorRole] >= NEST_ACCESS_LEVEL[targetRole]
  }

  isSameOrLowerRole(actorRole: NestMemberRole, targetRole: NestMemberRole) {
    return NEST_ACCESS_LEVEL[actorRole] <= NEST_ACCESS_LEVEL[targetRole]
  }

  isLowerRole(actorRole: NestMemberRole, targetRole: NestMemberRole) {
    return NEST_ACCESS_LEVEL[actorRole] < NEST_ACCESS_LEVEL[targetRole]
  }

  async getContext(
    nestId: string,
    userId?: string
  ): Promise<NestAccessContext> {
    const [settingsResult, membershipResult, banResult] = await Promise.allSettled([
      this.settingsRepo.get(nestId),
      userId ? this.membersRepo.findByUser(nestId, userId) : Promise.resolve(null),
      userId ? this.bansRepo.existsActive(nestId, userId) : Promise.resolve(null)
    ])

    if (settingsResult.status === 'rejected') {
      throw settingsResult.reason instanceof NestNotFoundException
        ? new NestNotFoundException()
        : settingsResult.reason
    }

    if (membershipResult.status === 'rejected') {
      throw membershipResult.reason
    }

    if (banResult.status === 'rejected') {
      throw banResult.reason
    }

    const settings = settingsResult.value
    const membership = membershipResult.value

    const role = membership?.role ?? null
    const isMember = membership !== null
    const isBanned = Boolean(banResult.value)
    const canViewNest = settings.visibility === NestVisibility.PUBLIC || isMember
    const canParticipate = canViewNest && !isBanned
    const isOwner = role === NestMemberRole.OWNER

    const hasAccess = (minRole: NestMemberRole) => canParticipate && this.hasMinRole(role, minRole)

    return {
      role,
      isMember,
      isBanned,
      isOwner,

      visibility: settings.visibility,
      joinPolicy: settings.joinPolicy,

      canViewNest,

      canCreateThread: hasAccess(settings.minThreadCreationRole),
      canCreateComment: hasAccess(settings.minCommentCreationRole),

      canEditNest: hasAccess(settings.minNestEditRole),

      canManageThreadLock: hasAccess(settings.minThreadLockManageRole),
      canManageThreadPin: hasAccess(settings.minThreadPinManageRole),
      canManageCommentPin: hasAccess(settings.minCommentPinManageRole),

      canModerateContent: hasAccess(settings.minContentModerateRole),

      canViewMembers: hasAccess(settings.minMemberViewRole),
      canManageInvites: hasAccess(settings.minInviteManageRole),
      canRemoveMembers: hasAccess(settings.minMemberRemoveRole),
      canManageJoinRequests: hasAccess(settings.minJoinRequestManageRole),
      canManageBans: hasAccess(settings.minBanManageRole),

      canManageSettings: isOwner,
      canDeleteNest: isOwner,
      canTransferOwnership: isOwner,
      canManageMemberRoles: isOwner,

      canLeaveNest: isMember && !isOwner
    }
  }
}
