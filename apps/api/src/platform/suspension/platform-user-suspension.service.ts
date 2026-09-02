import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { EventBus } from 'src/event/event-bus'
import { UserSuspensionCreateDto } from 'src/user/suspension/dto/user-suspension-create.dto'
import { UserSuspensionPresenter } from 'src/user/suspension/user-suspension.presenter'
import { UserSuspensionService } from 'src/user/suspension/user-suspension.service'
import { PlatformUserSuspendedEvent } from '../events/platform-user-suspended.event'
import { PlatformUserUnsuspendedEvent } from '../events/platform-user-unsuspended.event'
import { PlatformUserSuspensionPolicy } from './platform-user-suspension.policy'

/**
 * Platform-moderator wrapper around {@link UserSuspensionService} — adds the moderator
 * authorization check and publishes platform action-log events; the suspension logic itself
 * lives in the underlying service.
 */
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

  /**
   * @param userId - The user to suspend.
   * @param actorUserId - The moderator issuing the suspension.
   * @param dto - The suspension reason and duration.
   * @returns The new suspension's view.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform moderator or admin.
   * @throws {CannotSuspendYourselfException} `actorUserId` equals `userId`.
   * @throws {UserNotFoundException} `userId` does not exist.
   * @throws {UserAlreadySuspendedException} `userId` already has an active suspension.
   */
  async suspend(userId: string, actorUserId: string, dto: UserSuspensionCreateDto) {
    await this.policy.assertIsModerator(actorUserId)

    const suspension = await this.userSuspensions.suspend(userId, actorUserId, dto)

    this.logger.info({ userId, actorUserId, reason: dto.reason }, 'Platform suspension issued')
    void this.eventBus.publish(new PlatformUserSuspendedEvent({ userId, reason: dto.reason, suspendedById: actorUserId }))

    return this.presenter.toView(suspension)
  }

  /**
   * @param userId - The user to unsuspend.
   * @param actorUserId - The moderator lifting the suspension.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform moderator or admin.
   * @throws {UserSuspensionNotFoundException} `userId` has no active suspension.
   */
  async unsuspend(userId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    await this.userSuspensions.unsuspend(userId, actorUserId)

    this.logger.info({ userId, actorUserId }, 'Platform suspension lifted')
    void this.eventBus.publish(new PlatformUserUnsuspendedEvent({ userId, unsuspendedById: actorUserId }))
  }

  /**
   * @param userId - The user to check.
   * @param actorUserId - The moderator performing the lookup.
   * @returns The active suspension's view, or `null` if the user isn't currently suspended.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform moderator or admin.
   */
  async getActive(userId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    const active = await this.userSuspensions.getActive(userId)

    return this.presenter.toActiveView(active)
  }
}
