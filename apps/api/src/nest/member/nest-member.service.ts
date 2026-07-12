import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { NestPresenter } from '../nest.presenter'
import { NestRepository } from '../nest.repository'
import { MemberLeftEvent } from './events/member-left.event'
import { MemberRemovedEvent } from './events/member-removed.event'
import { MemberRoleChangedEvent } from './events/member-role-changed.event'
import { NestMemberPolicy } from './nest-member.policy'
import { NestMemberRepository } from './nest-member.repository'
import { NestMemberQueryDto } from './dto/nest-member.query.dto'
import { NestMemberUpdateRoleDto } from './dto/nest-member.update-role.dto'

@Injectable()
export class NestMemberService {
  constructor(
    private readonly membersRepo: NestMemberRepository,
    private readonly nestsRepo: NestRepository,
    private readonly policy: NestMemberPolicy,
    private readonly presenter: NestPresenter,
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

    return this.membersRepo.listByNestId(nest.id, query)
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

    return updated
  }

  async listAsUser(userId: string) {
    const memberships = await this.membersRepo.listNestsByMember(userId)

    return memberships.map(({ nest }) => this.presenter.toSummaryView(nest))
  }
}