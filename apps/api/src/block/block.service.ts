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

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new CannotBlockYourselfException()
    }

    await this.users.assertUserExists(blockedId)

    const block = await this.repo.createAndSelectBlockedUser(blockerId, blockedId)
    void this.eventBus.publish(new UserBlockedEvent({ blockerId, blockedId }))

    return this.presenter.toView(block)
  }

  async exists(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      return false
    }

    return this.repo.exists(blockerId, blockedId)
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.repo.deleteByUsers(blockerId, blockedId)
    void this.eventBus.publish(new UserUnblockedEvent({ blockerId, blockedId }))
  }

  async getBlockedUser(blockerId: string, blockedId: string) {
    const block = await this.repo.getBlockedUserById(blockerId, blockedId)
    return this.presenter.toView(block)
  }

  async listBlockedUsers(blockerId: string) {
    const blocks = await this.repo.listBlockedUsers(blockerId)
    return blocks.map((block) => this.presenter.toView(block))
  }
}
