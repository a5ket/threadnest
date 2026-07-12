import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { NestMemberRepository } from '../member/nest-member.repository'
import { NestRepository } from '../nest.repository'
import { NestJoinRequestNotFoundException } from './exceptions/nest-join-request-not-found.exception'
import { NestJoinRequestPolicy } from './nest-join-request.policy'
import { NestJoinRequestPresenter } from './nest-join-request.presenter'
import { NestJoinRequestRepository } from './nest-join-request.repository'
import { NestJoinRequestApprovedEvent } from './events/nest-join-request-approved.event'
import { NestJoinRequestCancelledEvent } from './events/nest-join-request-cancelled.event'
import { NestJoinRequestCreatedEvent } from './events/nest-join-request-created.event'
import { NestJoinRequestRejectedEvent } from './events/nest-join-request-rejected.event'

@Injectable()
export class NestJoinRequestService {
  constructor(
    private readonly nestRepo: NestRepository,
    private readonly requestRepo: NestJoinRequestRepository,
    private readonly memberRepo: NestMemberRepository,
    private readonly policy: NestJoinRequestPolicy,
    private readonly presenter: NestJoinRequestPresenter,
    private readonly transaction: TransactionManager,
    private readonly eventBus: EventBus,
  ) { }

  async create(nestSlug: string, actorUserId: string) {
    const nest = await this.nestRepo.getBySlug(nestSlug)

    await this.policy.assertCanCreate(nest, actorUserId)

    const request = await this.requestRepo.create(nest.id, actorUserId)

    void this.eventBus.publish(new NestJoinRequestCreatedEvent({
      requestId: request.id,
      nestId: request.nest.id,
      userId: request.user.id,
    }))

    return this.presenter.toUserView(request)
  }

  async cancel(requestId: string, actorUserId: string) {
    const request = await this.requestRepo.get(requestId)

    await this.policy.assertCanCancel(
      {
        nestId: request.nestId,
        userId: request.userId,
        status: request.status,
      },
      actorUserId,
    )

    await this.requestRepo.cancel(requestId, actorUserId)

    void this.eventBus.publish(new NestJoinRequestCancelledEvent({
      requestId: request.id,
      nestId: request.nestId,
      userId: request.userId,
    }))
  }

  async listAsNest(nestSlug: string, actorUserId: string) {
    const nest = await this.nestRepo.getBySlug(nestSlug)

    await this.policy.assertCanListAsNest(nest, actorUserId)

    return this.requestRepo.listAsNest(nest.id)
  }

  async listAsUser(actorUserId: string) {
    return this.requestRepo.listAsUser(actorUserId)
  }

  async getAsNest(
    nestSlug: string,
    requestId: string,
    actorUserId: string,
  ) {
    const request = await this.getRequestAsNest(nestSlug, requestId, actorUserId)

    return this.presenter.toNestView(request)
  }

  async getAsUser(requestId: string, actorUserId: string) {
    const request = await this.requestRepo.getSummary(requestId)

    await this.policy.assertCanGetAsUser(
      {
        userId: request.user.id,
        nestId: request.nest.id,
        status: request.status,
      },
      actorUserId,
    )

    return this.presenter.toUserView(request)
  }

  async approve(
    nestSlug: string,
    requestId: string,
    actorUserId: string,
  ) {
    const request = await this.getRequestAsNest(
      nestSlug,
      requestId,
      actorUserId,
    )

    await this.policy.assertCanApprove(
      {
        userId: request.user.id,
        nestId: request.nest.id,
        status: request.status,
      },
      actorUserId,
    )

    await this.transaction.run(async (tx) => {
      await this.requestRepo.approve(request.id, actorUserId, tx)
      await this.memberRepo.createMember(request.nest.id, request.user.id, tx)
      await this.nestRepo.adjustMemberCount(request.nest.id, 1, tx)
    })

    void this.eventBus.publish(new NestJoinRequestApprovedEvent({
      requestId: request.id,
      nestId: request.nest.id,
      userId: request.user.id,
      approvedById: actorUserId,
    }))
  }

  async reject(
    nestSlug: string,
    requestId: string,
    actorUserId: string,
  ) {
    const request = await this.getRequestAsNest(
      nestSlug,
      requestId,
      actorUserId,
    )

    await this.policy.assertCanReject(
      {
        userId: request.user.id,
        nestId: request.nest.id,
        status: request.status,
      },
      actorUserId,
    )

    await this.requestRepo.reject(request.id, actorUserId)

    void this.eventBus.publish(new NestJoinRequestRejectedEvent({
      requestId: request.id,
      nestId: request.nest.id,
      userId: request.user.id,
      rejectedById: actorUserId,
    }))
  }

  private async getRequestAsNest(
    nestSlug: string,
    requestId: string,
    actorUserId: string,
  ) {
    const request = await this.requestRepo.getSummary(requestId)

    if (request.nest.slug !== nestSlug) {
      throw new NestJoinRequestNotFoundException()
    }

    await this.policy.assertCanGetAsNest(
      {
        userId: request.user.id,
        nestId: request.nest.id,
        status: request.status,
      },
      actorUserId,
    )

    return request
  }
}