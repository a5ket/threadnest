import { Injectable } from '@nestjs/common'
import { NestMemberRole, NestVisibility } from 'generated/prisma/enums'
import { NestBanRepository } from './ban/nest-ban.repository'
import { NEST_ACCESS_LEVEL, NON_MEMBER_LEVEL } from './constants/nest-access-level'
import { NestNotFoundException } from './exceptions/nest-not-found.exception'
import { NestMemberRepository } from './member/nest-member.repository'
import { NestRepository } from './nest.repository'
import { NestSettingsNotFoundException } from './settings/exceptions/nest-settings-not-found.exception'
import { NestSettingsRepository } from './settings/nest-settings.repository'
import { NestAccessContext } from './types/nest.access-context'

@Injectable()
export class NestAccess {
  constructor(
    private readonly settingsRepo: NestSettingsRepository,
    private readonly bansRepo: NestBanRepository,
    private readonly membersRepo: NestMemberRepository,
    private readonly nestsRepo: NestRepository
  ) { }

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
    const [settingsResult, membershipResult, banResult, deletedAtResult] = await Promise.allSettled([
      this.settingsRepo.get(nestId),
      userId ? this.membersRepo.findByUser(nestId, userId) : Promise.resolve(null),
      userId ? this.bansRepo.existsActive(nestId, userId) : Promise.resolve(null),
      this.nestsRepo.getDeletedAt(nestId)
    ])

    if (settingsResult.status === 'rejected') {
      throw settingsResult.reason instanceof NestSettingsNotFoundException
        ? new NestNotFoundException()
        : settingsResult.reason
    }

    if (membershipResult.status === 'rejected') {
      throw membershipResult.reason
    }

    if (banResult.status === 'rejected') {
      throw banResult.reason
    }

    if (deletedAtResult.status === 'rejected') {
      throw deletedAtResult.reason
    }

    const settings = settingsResult.value
    const membership = membershipResult.value

    const role = membership?.role ?? null
    const level = role ? NEST_ACCESS_LEVEL[role] : NON_MEMBER_LEVEL
    const isMember = membership !== null
    const isBanned = Boolean(banResult.value)
    const isDeleted = Boolean(deletedAtResult.value)
    const canViewNest = !isDeleted && (settings.visibility === NestVisibility.PUBLIC || isMember)
    const canParticipate = canViewNest && !isBanned
    const isOwner = role === NestMemberRole.OWNER

    const hasAccess = (minLevel: number) => canParticipate && level >= minLevel

    return {
      role,
      level,
      isMember,
      isBanned,
      isOwner,

      visibility: settings.visibility,
      joinPolicy: settings.joinPolicy,

      canViewNest,

      canCreateThread: hasAccess(settings.minThreadCreationLevel),
      canCreateComment: hasAccess(settings.minCommentCreationLevel),

      canVoteThread: hasAccess(settings.minThreadVoteLevel),
      canVoteComment: hasAccess(settings.minCommentVoteLevel),

      canEditNest: hasAccess(settings.minNestEditLevel),

      canManageThreadLock: hasAccess(settings.minThreadLockManageLevel),
      canManageThreadPin: hasAccess(settings.minThreadPinManageLevel),
      canManageCommentPin: hasAccess(settings.minCommentPinManageLevel),

      canModerateContent: hasAccess(settings.minContentModerateLevel),

      canViewMembers: hasAccess(settings.minMemberViewLevel),
      canManageInvites: hasAccess(settings.minInviteManageLevel),
      canRemoveMembers: hasAccess(settings.minMemberRemoveLevel),
      canManageJoinRequests: hasAccess(settings.minJoinRequestManageLevel),
      canManageBans: hasAccess(settings.minBanManageLevel),
      canViewActionLog: hasAccess(settings.minActionLogViewLevel),

      canManageSettings: isOwner && !isDeleted,
      canDeleteNest: isOwner && !isDeleted,
      canTransferOwnership: isOwner && !isDeleted,
      canManageMemberRoles: isOwner && !isDeleted,

      canLeaveNest: isMember && !isOwner
    }
  }
}
