import { Injectable } from '@nestjs/common'
import { NestMemberRole, NestVisibility } from 'generated/prisma/enums'
import { NestBanRepository } from './ban/nest-ban.repository'
import { NEST_ACCESS_LEVEL, NON_MEMBER_LEVEL } from './constants/nest-access-level'
import { NestNotFoundException } from './exceptions/nest-not-found.exception'
import { NestMemberRepository } from './member/nest-member.repository'
import { NestRepository } from './nest.repository'
import { NestPaywallRepository } from './paywall/nest-paywall.repository'
import { NestSettingsNotFoundException } from './settings/exceptions/nest-settings-not-found.exception'
import { NestSettingsRepository } from './settings/nest-settings.repository'
import { NestSubscriptionRepository } from './subscription/nest-subscription.repository'
import { NestAccessContext } from './types/nest.access-context'

/**
 * Computes what a viewer (or an anonymous request) is allowed to do in a nest. This is the single
 * source of truth every nest-scoped policy checks against — see {@link getContext}.
 */
@Injectable()
export class NestAccess {
  constructor(
    private readonly settingsRepo: NestSettingsRepository,
    private readonly bansRepo: NestBanRepository,
    private readonly membersRepo: NestMemberRepository,
    private readonly nestsRepo: NestRepository,
    private readonly paywallRepo: NestPaywallRepository,
    private readonly subscriptionsRepo: NestSubscriptionRepository
  ) { }

  /** @returns true if `actorRole` outranks `targetRole` in the nest role hierarchy. */
  isHigherRole(actorRole: NestMemberRole, targetRole: NestMemberRole) {
    return NEST_ACCESS_LEVEL[actorRole] > NEST_ACCESS_LEVEL[targetRole]
  }

  /** @returns true if `actorRole` is at least as senior as `targetRole`. */
  isSameOrHigherRole(actorRole: NestMemberRole, targetRole: NestMemberRole) {
    return NEST_ACCESS_LEVEL[actorRole] >= NEST_ACCESS_LEVEL[targetRole]
  }

  /** @returns true if `actorRole` is at most as senior as `targetRole`. */
  isSameOrLowerRole(actorRole: NestMemberRole, targetRole: NestMemberRole) {
    return NEST_ACCESS_LEVEL[actorRole] <= NEST_ACCESS_LEVEL[targetRole]
  }

  /** @returns true if `actorRole` is outranked by `targetRole`. */
  isLowerRole(actorRole: NestMemberRole, targetRole: NestMemberRole) {
    return NEST_ACCESS_LEVEL[actorRole] < NEST_ACCESS_LEVEL[targetRole]
  }

  /**
   * Builds the full permission context for one viewer in one nest.
   *
   * The key distinction is `canViewNest` vs `canViewNestMetadata`: a paywalled public nest still
   * shows its name/description/member count to a non-subscriber (`canViewNestMetadata`, so the
   * nest is discoverable and the paywall is visible) but hides its actual content
   * (`canViewNest`, gated additionally on `hasActiveSubscription`). Every other `can*` flag is
   * derived from the nest's per-permission `min*Level` settings via `hasAccess`, which further
   * requires `canViewNest && !isBanned` — a banned member can still technically "view" metadata
   * but can't participate.
   *
   * @param nestId - The nest to compute access for.
   * @param userId - The viewer, or undefined for an anonymous request.
   * @returns The full set of `can*` flags plus role/membership/paywall/visibility context.
   * @throws {NestNotFoundException} No settings row for `nestId` (the nest doesn't exist).
   */
  async getContext(
    nestId: string,
    userId?: string
  ): Promise<NestAccessContext> {
    const [settingsResult, membershipResult, banResult, deletedAtResult, paywallResult] = await Promise.allSettled([
      this.settingsRepo.get(nestId),
      userId ? this.membersRepo.findByUser(nestId, userId) : Promise.resolve(null),
      userId ? this.bansRepo.existsActive(nestId, userId) : Promise.resolve(null),
      this.nestsRepo.getDeletedAt(nestId),
      this.paywallRepo.get(nestId)
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

    if (paywallResult.status === 'rejected') {
      throw paywallResult.reason
    }

    const settings = settingsResult.value
    const membership = membershipResult.value

    const role = membership?.role ?? null
    const level = role ? NEST_ACCESS_LEVEL[role] : NON_MEMBER_LEVEL
    const isMember = membership !== null
    const isBanned = Boolean(banResult.value)
    const isDeleted = Boolean(deletedAtResult.value)
    const isPaywalled = paywallResult.value?.isPaywalled ?? false
    const paywallPriceAmountCents = paywallResult.value?.priceAmountCents ?? null
    const hasActiveSubscription = userId && isPaywalled ? await this.subscriptionsRepo.existsActiveForUser(nestId, userId) : false
    const isPublic = settings.visibility === NestVisibility.PUBLIC
    const canViewNestMetadata = !isDeleted && (isMember || isPublic)
    const canViewNest = !isDeleted && (isMember || (isPublic && (!isPaywalled || hasActiveSubscription)))
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

      isPaywalled,
      paywallPriceAmountCents,
      hasActiveSubscription,

      canViewNest,
      canViewNestMetadata,

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
