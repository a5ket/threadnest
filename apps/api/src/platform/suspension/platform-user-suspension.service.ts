import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { EventBus } from 'src/event/event-bus'
import { UserSuspensionCreateDto } from 'src/user/suspension/dto/user-suspension-create.dto'
import { UserSuspensionPresenter } from 'src/user/suspension/user-suspension.presenter'
import { UserSuspensionService } from 'src/user/suspension/user-suspension.service'
import { PlatformUserSuspendedEvent } from '../events/platform-user-suspended.event'
import { PlatformUserUnsuspendedEvent } from '../events/platform-user-unsuspended.event'
import { PlatformUserSuspensionPolicy } from './platform-user-suspension.policy'

@Injectable()
export class PlatformUserSuspensionService {
  constructor(
    private readonly policy: PlatformUserSuspensionPolicy,
    private readonly userSuspensions: UserSuspensionService,
    private readonly presenter: UserSuspensionPresenter,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(PlatformUserSuspensionService.name)
  }

  async suspend(userId: string, actorUserId: string, dto: UserSuspensionCreateDto) {
    await this.policy.assertIsModerator(actorUserId)

    const suspension = await this.userSuspensions.suspend(userId, actorUserId, dto)

    this.logger.info({ userId, actorUserId, reason: dto.reason }, 'Platform suspension issued')
    void this.eventBus.publish(new PlatformUserSuspendedEvent({ userId, reason: dto.reason, suspendedById: actorUserId }))

    return this.presenter.toView(suspension)
  }

  async unsuspend(userId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    await this.userSuspensions.unsuspend(userId, actorUserId)

    this.logger.info({ userId, actorUserId }, 'Platform suspension lifted')
    void this.eventBus.publish(new PlatformUserUnsuspendedEvent({ userId, unsuspendedById: actorUserId }))
  }

  async getActive(userId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    const active = await this.userSuspensions.getActive(userId)

    return this.presenter.toActiveView(active)
  }
}
