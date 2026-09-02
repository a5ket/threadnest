import { Injectable } from '@nestjs/common'
import { NestInviteStatus } from 'generated/prisma/enums'
import { InviteNotPendingException } from './exceptions/invite-not-pending.exception'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestBanRepository } from '../ban/nest-ban.repository'
import { NestJoinRequestRepository } from '../join-request/nest-join-request.repository'
import { AlreadyHasPendingJoinRequestException } from '../join-request/exceptions/already-has-pending-join-request.exception'
import { NestMemberRepository } from '../member/nest-member.repository'
import { AlreadyMemberException } from '../member/exceptions/already-member.exception'
import { UserIsBannedException } from '../member/exceptions/user-is-banned.exception'
import { NestAccess } from '../nest.access'
import { UserNestPreferenceRepository } from '../preferences/user-nest-preference.repository'
import { NestPolicySubject } from '../types/nest.policy-subject'
import { AlreadyInvitedException } from './exceptions/already-invited.exception'
import { InvitesNotAllowedException } from './exceptions/invites-not-allowed.exception'
import { NestInviteNotFoundException } from './exceptions/nest-invite-not-found.exception'
import { NestInviteRepository } from './nest-invite.repository'
import { NestInvitePolicySubject } from './types/nest-invite.policy-subject'

@Injectable()
export class NestInvitePolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly memberRepo: NestMemberRepository,
    private readonly banRepo: NestBanRepository,
    private readonly inviteRepo: NestInviteRepository,
    private readonly requestRepo: NestJoinRequestRepository,
    private readonly preferences: UserNestPreferenceRepository,
  ) { }

  /**
   * @param nest - The inviting nest.
   * @param actorUserId - Must be authorized to manage invites in this nest.
   * @param targetUserId - The prospective invitee.
   * @throws {UserIsBannedException} `targetUserId` is actively banned from this nest.
   * @throws {AlreadyMemberException} `targetUserId` is already a member.
   * @throws {AlreadyInvitedException} A pending invite already exists.
   * @throws {AlreadyHasPendingJoinRequestException} A pending join request already exists (invite
   *   would create an ambiguous double-pending state).
   * @throws {InvitesNotAllowedException} `targetUserId`'s preferences block invites from this nest.
   */
  async assertCanCreate(nest: NestPolicySubject, actorUserId: string, targetUserId: string) {
    await this.assertCanManageNestInvites(nest.id, actorUserId)

    const [
      hasPendingRequest,
      hasPendingInvite,
      isMember,
      hasActiveBan,
      allowsInvites
    ] = await Promise.all([
      this.requestRepo.existsPending(nest.id, targetUserId),
      this.inviteRepo.existsPending(nest.id, targetUserId),
      this.memberRepo.exists(nest.id, targetUserId),
      this.banRepo.existsActive(nest.id, targetUserId),
      this.preferences.allowsInvites(targetUserId, nest.id)
    ])

    if (hasActiveBan) {
      throw new UserIsBannedException()
    }

    if (isMember) {
      throw new AlreadyMemberException()
    }

    if (hasPendingInvite) {
      throw new AlreadyInvitedException()
    }

    if (hasPendingRequest) {
      throw new AlreadyHasPendingJoinRequestException()
    }

    if (!allowsInvites) {
      throw new InvitesNotAllowedException()
    }
  }

  /** @throws {InsufficientPermissionsException} Not authorized to manage invites in this nest. */
  async assertCanListAsNest(nest: NestPolicySubject, actorUserId: string) {
    await this.assertCanManageNestInvites(nest.id, actorUserId)
  }

  /** @throws {InsufficientPermissionsException} Not authorized to manage invites in this nest. */
  async assertCanGetAsNest(invite: NestInvitePolicySubject, actorUserId: string) {
    await this.assertCanManageNestInvites(invite.nestId, actorUserId)
  }

  /** @throws {NestInviteNotFoundException} The invite isn't addressed to `actorUserId`. */
  async assertCanGetAsUser(invite: NestInvitePolicySubject, actorUserId: string) {
    if (invite.userId !== actorUserId) {
      throw new NestInviteNotFoundException()
    }
  }

  /**
   * @throws {NestInviteNotFoundException} The invite isn't addressed to `actorUserId`.
   * @throws {InviteNotPendingException} Already resolved.
   * @throws {AlreadyMemberException} Already a member (e.g. joined some other way since inviting).
   * @throws {UserIsBannedException} Actively banned from this nest.
   */
  async assertCanAccept(invite: NestInvitePolicySubject, actorUserId: string) {
    if (invite.userId !== actorUserId) {
      throw new NestInviteNotFoundException()
    }

    if (invite.status !== NestInviteStatus.PENDING) {
      throw new InviteNotPendingException()
    }

    const [isMember, hasActiveBan] = await Promise.all([
      this.memberRepo.exists(invite.nestId, actorUserId),
      this.banRepo.existsActive(invite.nestId, actorUserId),
    ])

    if (isMember) {
      throw new AlreadyMemberException()
    }

    if (hasActiveBan) {
      throw new UserIsBannedException()
    }
  }

  /**
   * @throws {NestInviteNotFoundException} The invite isn't addressed to `actorUserId`.
   * @throws {InviteNotPendingException} Already resolved.
   */
  async assertCanDecline(invite: NestInvitePolicySubject, actorUserId: string) {
    if (invite.userId !== actorUserId) {
      throw new NestInviteNotFoundException()
    }

    if (invite.status !== NestInviteStatus.PENDING) {
      throw new InviteNotPendingException()
    }
  }

  /**
   * @throws {InsufficientPermissionsException} Not authorized to manage invites in this nest.
   * @throws {InviteNotPendingException} Already resolved.
   */
  async assertCanRevoke(invite: NestInvitePolicySubject, actorUserId: string) {
    await this.assertCanManageNestInvites(invite.nestId, actorUserId)

    if (invite.status !== NestInviteStatus.PENDING) {
      throw new InviteNotPendingException()
    }
  }

  /** @throws {InsufficientPermissionsException} Not authorized to manage invites in this nest. */
  private async assertCanManageNestInvites(nestId: string, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canManageInvites) {
      throw new InsufficientPermissionsException()
    }
  }
}