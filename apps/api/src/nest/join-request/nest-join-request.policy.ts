import { Injectable } from '@nestjs/common'
import { NestJoinPolicy, NestJoinRequestStatus } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestBanRepository } from '../ban/nest-ban.repository'
import { AlreadyInvitedException } from '../invite/exceptions/already-invited.exception'
import { NestInviteRepository } from '../invite/nest-invite.repository'
import { NestMemberRepository } from '../member/nest-member.repository'
import { AlreadyMemberException } from '../member/exceptions/already-member.exception'
import { UserIsBannedException } from '../member/exceptions/user-is-banned.exception'
import { NestAccess } from '../nest.access'
import { NestPolicySubject } from '../types/nest.policy-subject'
import { AlreadyHasPendingJoinRequestException } from './exceptions/already-has-pending-join-request.exception'
import { JoinRequestNotPendingException } from './exceptions/join-request-not-pending.exception'
import { JoinRequestsNotAcceptedException } from './exceptions/join-requests-not-accepted.exception'
import { NestJoinRequestNotFoundException } from './exceptions/nest-join-request-not-found.exception'
import { NestJoinRequestRepository } from './nest-join-request.repository'
import { NestJoinRequestPolicySubject } from './types/nest-join-request.policy-subject'

@Injectable()
export class NestJoinRequestPolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly requestRepo: NestJoinRequestRepository,
    private readonly memberRepo: NestMemberRepository,
    private readonly banRepo: NestBanRepository,
    private readonly inviteRepo: NestInviteRepository
  ) { }

  /**
   * @param nest - The nest to request to join.
   * @param actorUserId - The requesting user.
   * @throws {JoinRequestsNotAcceptedException} This nest's join policy isn't `BY_REQUEST`.
   * @throws {AlreadyMemberException} Already a member.
   * @throws {UserIsBannedException} Actively banned from this nest.
   * @throws {AlreadyHasPendingJoinRequestException} A pending request already exists.
   * @throws {AlreadyInvitedException} A pending invite already exists (request would create an
   *   ambiguous double-pending state).
   */
  async assertCanCreate(nest: NestPolicySubject, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (ctx.joinPolicy !== NestJoinPolicy.BY_REQUEST) {
      throw new JoinRequestsNotAcceptedException()
    }

    if (ctx.isMember) {
      throw new AlreadyMemberException()
    }

    if (ctx.isBanned) {
      throw new UserIsBannedException()
    }

    const [hasPendingRequest, hasPendingInvite] = await Promise.all([
      this.requestRepo.existsPending(nest.id, actorUserId),
      this.inviteRepo.existsPending(nest.id, actorUserId)
    ])

    if (hasPendingRequest) {
      throw new AlreadyHasPendingJoinRequestException()
    }

    if (hasPendingInvite) {
      throw new AlreadyInvitedException()
    }
  }

  /**
   * @throws {NestJoinRequestNotFoundException} The request isn't `actorUserId`'s own.
   * @throws {JoinRequestNotPendingException} Already resolved.
   */
  async assertCanCancel(request: NestJoinRequestPolicySubject, actorUserId: string) {
    if (request.userId !== actorUserId) {
      throw new NestJoinRequestNotFoundException()
    }

    if (request.status !== NestJoinRequestStatus.PENDING) {
      throw new JoinRequestNotPendingException()
    }
  }

  /** @throws {InsufficientPermissionsException} Not authorized to manage join requests in this nest. */
  async assertCanListAsNest(nest: NestPolicySubject, actorUserId: string) {
    await this.assertCanManageNestJoinRequests(nest.id, actorUserId)
  }

  /** @throws {NestJoinRequestNotFoundException} The request isn't `actorUserId`'s own. */
  async assertCanGetAsUser(request: NestJoinRequestPolicySubject, actorUserId: string) {
    if (request.userId !== actorUserId) {
      throw new NestJoinRequestNotFoundException()
    }
  }

  /** @throws {InsufficientPermissionsException} Not authorized to manage join requests in this nest. */
  async assertCanGetAsNest(request: NestJoinRequestPolicySubject, actorUserId: string) {
    await this.assertCanManageNestJoinRequests(request.nestId, actorUserId)
  }

  /**
   * @throws {InsufficientPermissionsException} Not authorized to manage join requests in this nest.
   * @throws {JoinRequestNotPendingException} Already resolved.
   * @throws {AlreadyMemberException} Already a member (e.g. joined some other way since requesting).
   * @throws {UserIsBannedException} Actively banned from this nest.
   */
  async assertCanApprove(
    request: NestJoinRequestPolicySubject,
    actorUserId: string,
  ) {
    await this.assertCanManageNestJoinRequests(request.nestId, actorUserId)

    if (request.status !== NestJoinRequestStatus.PENDING) {
      throw new JoinRequestNotPendingException()
    }

    const [isMember, hasActiveBan] = await Promise.all([
      this.memberRepo.exists(request.nestId, request.userId),
      this.banRepo.existsActive(request.nestId, request.userId),
    ])

    if (isMember) {
      throw new AlreadyMemberException()
    }

    if (hasActiveBan) {
      throw new UserIsBannedException()
    }
  }

  /**
   * @throws {InsufficientPermissionsException} Not authorized to manage join requests in this nest.
   * @throws {JoinRequestNotPendingException} Already resolved.
   */
  async assertCanReject(request: NestJoinRequestPolicySubject, actorUserId: string) {
    await this.assertCanManageNestJoinRequests(request.nestId, actorUserId)

    if (request.status !== NestJoinRequestStatus.PENDING) {
      throw new JoinRequestNotPendingException()
    }
  }

  /** @throws {InsufficientPermissionsException} Not authorized to manage join requests in this nest. */
  private async assertCanManageNestJoinRequests(nestId: string, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canManageJoinRequests) {
      throw new InsufficientPermissionsException()
    }
  }
}