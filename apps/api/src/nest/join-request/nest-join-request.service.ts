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

/** User-initiated requests to join a nest — the counterpart to nest-initiated {@link NestInviteService} invites. */
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

  /**
   * @param nestSlug - The nest to request to join.
   * @param actorUserId - The requesting user.
   */
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

  /**
   * @param requestId - The request to cancel.
   * @param actorUserId - Must be the requester.
   */
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

  /**
   * @param nestSlug - The nest whose incoming requests to list.
   * @param actorUserId - Must be authorized to manage join requests in this nest.
   */
  async listAsNest(nestSlug: string, actorUserId: string) {
    const nest = await this.nestRepo.getBySlug(nestSlug)

    await this.policy.assertCanListAsNest(nest, actorUserId)

    const requests = await this.requestRepo.listAsNest(nest.id)

    return requests.map((request) => this.presenter.toNestView(request))
  }

  /** @param actorUserId - Lists the requests filed by this user. */
  async listAsUser(actorUserId: string) {
    const requests = await this.requestRepo.listAsUser(actorUserId)

    return requests.map((request) => this.presenter.toUserView(request))
  }

  /**
   * @param nestSlug - The nest the request belongs to.
   * @param requestId - The request to look up.
   * @param actorUserId - Must be authorized to manage join requests in this nest.
   */
  async getAsNest(
    nestSlug: string,
    requestId: string,
    actorUserId: string,
  ) {
    const request = await this.getRequestAsNest(nestSlug, requestId, actorUserId)

    return this.presenter.toNestView(request)
  }

  /**
   * @param requestId - The request to look up.
   * @param actorUserId - Must be the requester.
   */
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

  /**
   * Approves and creates the resulting membership in one transaction.
   *
   * @param nestSlug - The nest the request belongs to.
   * @param requestId - The request to approve.
   * @param actorUserId - Must be authorized to manage join requests in this nest.
   */
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
      nestSlug: request.nest.slug,
      nestName: request.nest.name,
      userId: request.user.id,
      approvedById: actorUserId,
    }))
  }

  /**
   * @param nestSlug - The nest the request belongs to.
   * @param requestId - The request to reject.
   * @param actorUserId - Must be authorized to manage join requests in this nest.
   */
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
      nestSlug: request.nest.slug,
      nestName: request.nest.name,
      userId: request.user.id,
      rejectedById: actorUserId,
    }))
  }

  /** @throws {NestJoinRequestNotFoundException} `requestId` doesn't belong to `nestSlug`. */
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