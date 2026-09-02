import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { NestMemberRepository } from '../member/nest-member.repository'
import { NestRepository } from '../nest.repository'
import { UserBannedEvent } from './events/user-banned.event'
import { UserUnbannedEvent } from './events/user-unbanned.event'
import { NestBanPresenter } from './nest-ban.presenter'
import { NestBanPolicy } from './nest-ban.policy'
import { NestBanRepository } from './nest-ban.repository'

/** Nest-level bans — separate from platform-wide suspensions ({@link UserSuspensionService}). */
@Injectable()
export class NestBanService {
  constructor(
    private readonly policy: NestBanPolicy,
    private readonly bansRepo: NestBanRepository,
    private readonly nestsRepo: NestRepository,
    private readonly membersRepo: NestMemberRepository,
    private readonly presenter: NestBanPresenter,
    private readonly transactions: TransactionManager,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(NestBanService.name)
  }

  /**
   * Bans the target and removes their membership, if they had one, in one transaction.
   *
   * @param nestSlug - The nest to ban from.
   * @param actorUserId - The moderator/owner issuing the ban.
   * @param targetUserId - The user being banned.
   */
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

    this.logger.info({ nestId: nest.id, targetUserId, actorUserId, reason: ban.reason }, 'User banned from nest')
    void this.eventBus.publish(new UserBannedEvent({
      nestId: nest.id,
      nestSlug: nest.slug,
      nestName: nest.name,
      userId: targetUserId,
      bannedById: actorUserId,
      reason: ban.reason,
    }))

    return this.presenter.toSummaryView(ban)
  }

  /**
   * @param nestSlug - The nest to unban from.
   * @param actorUserId - The moderator/owner revoking the ban.
   * @param targetUserId - The user being unbanned.
   */
  async unbanUser(nestSlug: string, actorUserId: string, targetUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanUnbanUser(nest.id, actorUserId, targetUserId)

    await this.bansRepo.revoke(nest.id, targetUserId, actorUserId)

    this.logger.info({ nestId: nest.id, targetUserId, actorUserId }, 'User unbanned from nest')
    void this.eventBus.publish(new UserUnbannedEvent({ nestId: nest.id, userId: targetUserId, unbannedById: actorUserId }))
  }

  /**
   * @param nestSlug - The nest whose ban list to view.
   * @param actorUserId - Must be authorized to view bans in this nest.
   */
  async listBans(nestSlug: string, actorUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanViewBans(nest.id, actorUserId)

    const bans = await this.bansRepo.listSummaryByNestId(nest.id)
    return bans.map((ban) => this.presenter.toSummaryView(ban))
  }
}