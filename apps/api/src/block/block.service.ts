import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { UserService } from 'src/user/user.service'
import { CannotBlockYourselfException } from './exceptions/cannot-block-yourself.exception'
import { BlockPresenter } from './block.presenter'
import { BlockRepository } from './block.repository'
import { UserBlockedEvent } from './events/user-blocked.event'
import { UserUnblockedEvent } from './events/user-unblocked.event'

@Injectable()
export class BlockService {
  constructor(
    private readonly repo: BlockRepository,
    private readonly users: UserService,
    private readonly presenter: BlockPresenter,
    private readonly eventBus: EventBus
  ) { }

  /**
   * @param blockerId - The user creating the block.
   * @param blockedId - The user being blocked.
   * @returns The new block's view.
   * @throws {CannotBlockYourselfException} `blockerId` equals `blockedId`.
   * @throws {UserNotFoundException} `blockedId` does not exist.
   * @throws {AlreadyBlockedException} `blockerId` has already blocked `blockedId`.
   */
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new CannotBlockYourselfException()
    }

    await this.users.assertUserExists(blockedId)

    const block = await this.repo.createAndSelectBlockedUser(blockerId, blockedId)
    void this.eventBus.publish(new UserBlockedEvent({ blockerId, blockedId }))

    return this.presenter.toView(block)
  }

  /**
   * A user is never considered blocked by themselves, even if a self-block row somehow existed —
   * checked before hitting the DB.
   *
   * @param blockerId - The potential blocker.
   * @param blockedId - The potential blocked user.
   * @returns Whether `blockerId` has blocked `blockedId`.
   */
  async exists(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      return false
    }

    return this.repo.exists(blockerId, blockedId)
  }

  /**
   * @param blockerId - The user removing the block.
   * @param blockedId - The user being unblocked.
   * @throws {NotBlockedException} No block from `blockerId` to `blockedId` exists.
   */
  async unblockUser(blockerId: string, blockedId: string) {
    await this.repo.deleteByUsers(blockerId, blockedId)
    void this.eventBus.publish(new UserUnblockedEvent({ blockerId, blockedId }))
  }

  /**
   * @param blockerId - The blocker.
   * @param blockedId - The blocked user.
   * @returns The block's view.
   * @throws {NotBlockedException} No block from `blockerId` to `blockedId` exists.
   */
  async getBlockedUser(blockerId: string, blockedId: string) {
    const block = await this.repo.getBlockedUserById(blockerId, blockedId)
    return this.presenter.toView(block)
  }

  /**
   * @param blockerId - The user whose blocklist to fetch.
   * @returns Every user `blockerId` has blocked, newest first.
   */
  async listBlockedUsers(blockerId: string) {
    const blocks = await this.repo.listBlockedUsers(blockerId)
    return blocks.map((block) => this.presenter.toView(block))
  }
}
