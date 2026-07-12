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

  async create(nestSlug: string, actorUserId: string, targetUserId: string) {
    const nest = await this.nestRepo.getBySlug(nestSlug)

    await this.policy.assertCanCreate(nest, actorUserId, targetUserId)

    const invite = await this.inviteRepo.create(nest.id, targetUserId, actorUserId)

    void this.eventBus.publish(new InviteSentEvent({
      inviteId: invite.id,
      nestId: nest.id,
      userId: targetUserId,
      invitedById: actorUserId
    }))

    return this.presenter.toNestView(invite)
  }

  async listAsNest(nestSlug: string, actorUserId: string) {
    const nest = await this.nestRepo.getBySlug(nestSlug)

    await this.policy.assertCanListAsNest(nest, actorUserId)

    return this.inviteRepo.listAsNest(nest.id)
  }

  async listAsUser(actorUserId: string) {
    return this.inviteRepo.listAsUser(actorUserId)
  }

  async getAsNest(nestSlug: string, inviteId: string, actorUserId: string) {
    const invite = await this.getInviteAsNest(nestSlug, inviteId, actorUserId)

    return this.presenter.toNestView(invite)
  }

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
