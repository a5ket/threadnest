import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { NestMemberRepository } from '../member/nest-member.repository'
import { NestRepository } from '../nest.repository'
import { UserBannedEvent } from './events/user-banned.event'
import { UserUnbannedEvent } from './events/user-unbanned.event'
import { NestBanPresenter } from './nest-ban.presenter'
import { NestBanPolicy } from './nest-ban.policy'
import { NestBanRepository } from './nest-ban.repository'

@Injectable()
export class NestBanService {
  constructor(
    private readonly policy: NestBanPolicy,
    private readonly bansRepo: NestBanRepository,
    private readonly nestsRepo: NestRepository,
    private readonly membersRepo: NestMemberRepository,
    private readonly presenter: NestBanPresenter,
    private readonly transactions: TransactionManager,
    private readonly eventBus: EventBus
  ) { }

  async banUser(nestSlug: string, actorUserId: string, targetUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanBanUser(nest.id, actorUserId, targetUserId)

    const ban = await this.transactions.run(async (tx) => {
      const result = await this.bansRepo.create(nest.id, targetUserId, actorUserId, tx)
      const deleted = await this.membersRepo.deleteIfExistsByUserId(nest.id, targetUserId, tx)
      if (deleted.count > 0) {
        await this.nestsRepo.adjustMemberCount(nest.id, -1, tx)
      }
      return result
    })
    void this.eventBus.publish(new UserBannedEvent({ nestId: nest.id, userId: targetUserId, bannedById: actorUserId }))

    return ban
  }

  async unbanUser(nestSlug: string, actorUserId: string, targetUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanUnbanUser(nest.id, actorUserId, targetUserId)

    await this.bansRepo.revoke(nest.id, targetUserId, actorUserId)
    void this.eventBus.publish(new UserUnbannedEvent({ nestId: nest.id, userId: targetUserId, unbannedById: actorUserId }))
  }

  async listBans(nestSlug: string, actorUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanViewBans(nest.id, actorUserId)

    const bans = await this.bansRepo.listSummaryByNestId(nest.id)
    return bans.map((ban) => this.presenter.toSummaryView(ban))
  }
}