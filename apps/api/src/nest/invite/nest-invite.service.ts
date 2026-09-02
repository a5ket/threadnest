import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { NestMemberRepository } from '../member/nest-member.repository'
import { NestRepository } from '../nest.repository'
import { InviteAcceptedEvent } from './events/invite-accepted.event'
import { InviteDeclinedEvent } from './events/invite-declined.event'
import { InviteRevokedEvent } from './events/invite-revoked.event'
import { InviteSentEvent } from './events/invite-sent.event'
import { NestInviteNotFoundException } from './exceptions/nest-invite-not-found.exception'
import { NestInvitePolicy } from './nest-invite.policy'
import { NestInvitePresenter } from './nest-invite.presenter'
import { NestInviteRepository } from './nest-invite.repository'

/** Nest-initiated invites — the counterpart to user-initiated {@link NestJoinRequestService} requests. */
@Injectable()
export class NestInviteService {
  constructor(
    private readonly nestRepo: NestRepository,
    private readonly inviteRepo: NestInviteRepository,
    private readonly memberRepo: NestMemberRepository,
    private readonly policy: NestInvitePolicy,
    private readonly presenter: NestInvitePresenter,
    private readonly transaction: TransactionManager,
    private readonly eventBus: EventBus
  ) { }

  /**
   * @param nestSlug - The inviting nest.
   * @param actorUserId - The moderator/owner sending the invite.
   * @param targetUserId - The user being invited.
   */
  async create(nestSlug: string, actorUserId: string, targetUserId: string) {
    const nest = await this.nestRepo.getBySlug(nestSlug)

    await this.policy.assertCanCreate(nest, actorUserId, targetUserId)

    const invite = await this.inviteRepo.create(nest.id, targetUserId, actorUserId)

    void this.eventBus.publish(new InviteSentEvent({
      inviteId: invite.id,
      nestId: nest.id,
      nestSlug: nest.slug,
      nestName: nest.name,
      userId: targetUserId,
      invitedById: actorUserId,
      message: invite.message,
    }))

    return this.presenter.toNestView(invite)
  }

  /**
   * @param nestSlug - The nest whose sent invites to list.
   * @param actorUserId - Must be authorized to manage invites in this nest.
   */
  async listAsNest(nestSlug: string, actorUserId: string) {
    const nest = await this.nestRepo.getBySlug(nestSlug)

    await this.policy.assertCanListAsNest(nest, actorUserId)

    const invites = await this.inviteRepo.listAsNest(nest.id)

    return invites.map((invite) => this.presenter.toNestView(invite))
  }

  /** @param actorUserId - Lists the invites addressed to this user. */
  async listAsUser(actorUserId: string) {
    const invites = await this.inviteRepo.listAsUser(actorUserId)

    return invites.map((invite) => this.presenter.toUserView(invite))
  }

  /**
   * @param nestSlug - The nest the invite belongs to.
   * @param inviteId - The invite to look up.
   * @param actorUserId - Must be authorized to manage invites in this nest.
   */
  async getAsNest(nestSlug: string, inviteId: string, actorUserId: string) {
    const invite = await this.getInviteAsNest(nestSlug, inviteId, actorUserId)

    return this.presenter.toNestView(invite)
  }

  /**
   * @param inviteId - The invite to look up.
   * @param actorUserId - Must be the invited user.
   */
  async getAsUser(inviteId: string, actorUserId: string) {
    const invite = await this.inviteRepo.getSummary(inviteId)

    await this.policy.assertCanGetAsUser(
      {
        userId: invite.user.id,
        nestId: invite.nest.id,
        status: invite.status,
      },
      actorUserId,
    )

    return this.presenter.toUserView(invite)
  }

  /**
   * Accepts and creates the resulting membership in one transaction.
   *
   * @param inviteId - The invite to accept.
   * @param actorUserId - Must be the invited user.
   */
  async accept(inviteId: string, actorUserId: string) {
    const invite = await this.inviteRepo.getSummary(inviteId)

    await this.policy.assertCanAccept(
      {
        userId: invite.user.id,
        nestId: invite.nest.id,
        status: invite.status,
      },
      actorUserId,
    )

    await this.transaction.run(async (tx) => {
      await this.inviteRepo.accept(invite.id, actorUserId, tx)
      await this.memberRepo.createMember(invite.nest.id, invite.user.id, tx)
      await this.nestRepo.adjustMemberCount(invite.nest.id, 1, tx)
    })

    void this.eventBus.publish(new InviteAcceptedEvent({
      inviteId: invite.id,
      nestId: invite.nest.id,
      userId: invite.user.id,
    }))
  }

  /**
   * @param inviteId - The invite to decline.
   * @param actorUserId - Must be the invited user.
   */
  async decline(inviteId: string, actorUserId: string) {
    const invite = await this.inviteRepo.getSummary(inviteId)

    await this.policy.assertCanDecline(
      {
        userId: invite.user.id,
        nestId: invite.nest.id,
        status: invite.status,
      },
      actorUserId,
    )

    await this.inviteRepo.decline(invite.id, actorUserId)

    void this.eventBus.publish(new InviteDeclinedEvent({
      inviteId: invite.id,
      nestId: invite.nest.id,
      userId: invite.user.id,
    }))
  }

  /**
   * @param nestSlug - The nest the invite belongs to.
   * @param inviteId - The invite to revoke.
   * @param actorUserId - Must be authorized to manage invites in this nest.
   */
  async revoke(nestSlug: string, inviteId: string, actorUserId: string) {
    const invite = await this.getInviteAsNest(nestSlug, inviteId, actorUserId)

    await this.policy.assertCanRevoke(
      {
        userId: invite.user.id,
        nestId: invite.nest.id,
        status: invite.status,
      },
      actorUserId,
    )

    await this.inviteRepo.revoke(invite.id, actorUserId)

    void this.eventBus.publish(new InviteRevokedEvent({
      inviteId: invite.id,
      nestId: invite.nest.id,
      userId: invite.user.id,
      revokedById: actorUserId,
    }))
  }

  /** @throws {NestInviteNotFoundException} `inviteId` doesn't belong to `nestSlug`. */
  private async getInviteAsNest(
    nestSlug: string,
    inviteId: string,
    actorUserId: string,
  ) {
    const invite = await this.inviteRepo.getSummary(inviteId)

    if (invite.nest.slug !== nestSlug) {
      throw new NestInviteNotFoundException()
    }

    await this.policy.assertCanGetAsNest(
      {
        userId: invite.user.id,
        nestId: invite.nest.id,
        status: invite.status,
      },
      actorUserId,
    )

    return invite
  }
}
