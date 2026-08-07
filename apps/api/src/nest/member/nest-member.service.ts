import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { NestPresenter } from '../nest.presenter'
import { NestRepository } from '../nest.repository'
import { NestMemberQueryDto } from './dto/nest-member.query.dto'
import { NestMemberUpdateRoleDto } from './dto/nest-member.update-role.dto'
import { MemberJoinedEvent } from './events/member-joined.event'
import { MemberLeftEvent } from './events/member-left.event'
import { MemberRemovedEvent } from './events/member-removed.event'
import { MemberRoleChangedEvent } from './events/member-role-changed.event'
import { NestMemberPolicy } from './nest-member.policy'
import { NestMemberPresenter } from './nest-member.presenter'
import { NestMemberRepository } from './nest-member.repository'

@Injectable()
export class NestMemberService {
  constructor(
    private readonly membersRepo: NestMemberRepository,
    private readonly nestsRepo: NestRepository,
    private readonly policy: NestMemberPolicy,
    private readonly presenter: NestPresenter,
    private readonly memberPresenter: NestMemberPresenter,
    private readonly transactionManager: TransactionManager,
    private readonly eventBus: EventBus
  ) { }

  async getMembershipByUser(nestSlug: string, userId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    return this.membersRepo.getByUser(nest.id, userId)
  }

  async listMembers(nestSlug: string, actorUserId: string, query: NestMemberQueryDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanListMembers(nest, actorUserId)

    const { items, meta } = await this.membersRepo.listByNestId(nest.id, query)

    return { items: items.map((item) => this.memberPresenter.toView(item)), meta }
  }

  async joinNest(nestSlug: string, userId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanJoinNest(nest, userId)

    const member = await this.transactionManager.run(async (tx) => {
      const created = await this.membersRepo.createMember(nest.id, userId, tx)
      await this.nestsRepo.adjustMemberCount(nest.id, 1, tx)
      return created
    })

    void this.eventBus.publish(new MemberJoinedEvent({ nestId: nest.id, userId }))

    return this.memberPresenter.toView(member)
  }

  async leaveNest(nestSlug: string, userId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanLeaveNest(nest, userId)

    await this.transactionManager.run(async (tx) => {
      await this.membersRepo.deleteByUserId(nest.id, userId, tx)
      await this.nestsRepo.adjustMemberCount(nest.id, -1, tx)
    })

    void this.eventBus.publish(new MemberLeftEvent({ nestId: nest.id, userId }))
  }

  async removeMember(nestSlug: string, actorUserId: string, targetUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanRemoveMember(nest, actorUserId, targetUserId)

    await this.transactionManager.run(async (tx) => {
      await this.membersRepo.deleteByUserId(nest.id, targetUserId, tx)
      await this.nestsRepo.adjustMemberCount(nest.id, -1, tx)
    })

    void this.eventBus.publish(new MemberRemovedEvent({ nestId: nest.id, actorUserId, targetUserId }))
  }

  async changeRole(nestSlug: string, actorUserId: string, targetUserId: string, dto: NestMemberUpdateRoleDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanChangeRole(nest, actorUserId, targetUserId, dto.role)

    const updated = await this.membersRepo.updateRole(nest.id, targetUserId, dto.role)

    void this.eventBus.publish(new MemberRoleChangedEvent({ nestId: nest.id, actorUserId, targetUserId, newRole: dto.role }))

    return this.memberPresenter.toView(updated)
  }

  async listNestsByUser(userId: string) {
    const memberships = await this.membersRepo.listMembershipsByUser(userId)

    return memberships.map(({ nest }) => this.presenter.toSummaryView(nest))
  }

  async listMembershipReferencesByUser(userId: string) {
    const memberships = await this.membersRepo.listMembershipReferencesByUser(userId)

    return memberships.map(({ nest }) => this.presenter.toReferenceView(nest))
  }
}