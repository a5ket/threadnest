import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { UserService } from 'src/user/user.service'
import { PlatformRoleGrantCreateDto } from './dto/platform-role-grant-create.dto'
import { PlatformRoleChangedEvent } from '../events/platform-role-changed.event'
import { PlatformRoleGrantedEvent } from '../events/platform-role-granted.event'
import { PlatformRoleRevokedEvent } from '../events/platform-role-revoked.event'
import { PlatformRoleGrantPolicy } from './platform-role-grant.policy'
import { PlatformRoleGrantPresenter } from './platform-role-grant.presenter'
import { PlatformRoleGrantRepository } from './platform-role-grant.repository'

@Injectable()
export class PlatformRoleGrantService {
  constructor(
    private readonly user: UserService,
    private readonly roleGrant: PlatformRoleGrantRepository,
    private readonly policy: PlatformRoleGrantPolicy,
    private readonly presenter: PlatformRoleGrantPresenter,
    private readonly transactionManager: TransactionManager,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(PlatformRoleGrantService.name)
  }

  /**
   * Grants a platform role to a user who doesn't currently have one. To change an existing
   * grant, use {@link changeRole} instead — this throws if the user already has an active role.
   *
   * @param userId - The user receiving the role.
   * @param actorUserId - The admin granting it.
   * @param dto - The role to grant.
   * @returns The new grant's view.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform admin.
   * @throws {UserNotFoundException} `userId` does not exist.
   * @throws {UserAlreadyHasActiveRoleException} `userId` already has an active grant.
   */
  async grantRole(userId: string, actorUserId: string, dto: PlatformRoleGrantCreateDto) {
    await this.policy.assertIsAdmin(actorUserId)
    await this.user.assertUserExists(userId)

    const grant = await this.roleGrant.create(userId, actorUserId, dto)

    this.logger.info({ userId, actorUserId, role: dto.role }, 'Platform role granted')
    void this.eventBus.publish(new PlatformRoleGrantedEvent({ userId, role: dto.role, grantedById: actorUserId }))

    return this.presenter.toView(grant)
  }

  /**
   * System-initiated grant with no acting admin — for bootstrapping scenarios (e.g. the first
   * platform admin) where no authenticated actor exists yet. Skips the
   * {@link PlatformRoleGrantPolicy.assertIsAdmin} check for that reason.
   *
   * @param userEmail - The recipient's email.
   * @param dto - The role to grant.
   * @returns The new grant.
   * @throws {UserNotFoundException} No user with this email.
   * @throws {UserAlreadyHasActiveRoleException} The user already has an active grant.
   */
  async grantRoleBySystemForEmail(userEmail: string, dto: PlatformRoleGrantCreateDto) {
    const user = await this.user.getByEmail(userEmail)

    return this.roleGrant.createWithoutActor(user.id, dto)
  }

  /**
   * Revokes the user's current active grant and creates the new one atomically, so a mid-way
   * failure never leaves the user with no role at all. Requires an existing active grant — use
   * {@link grantRole} for a user's first role.
   *
   * @param userId - The user whose role to change.
   * @param actorUserId - The admin making the change.
   * @param dto - The new role.
   * @returns The new grant's view.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform admin.
   * @throws {UserNotFoundException} `userId` does not exist.
   * @throws {PlatformRoleGrantNotFoundException} `userId` has no active grant to change.
   */
  async changeRole(userId: string, actorUserId: string, dto: PlatformRoleGrantCreateDto) {
    await this.policy.assertIsAdmin(actorUserId)
    await this.user.assertUserExists(userId)

    const grant = await this.transactionManager.run(async (tx) => {
      await this.roleGrant.revoke(userId, actorUserId, tx)
      return this.roleGrant.create(userId, actorUserId, dto, tx)
    })

    this.logger.info({ userId, actorUserId, newRole: dto.role }, 'Platform role changed')
    void this.eventBus.publish(new PlatformRoleChangedEvent({ userId, newRole: dto.role, changedById: actorUserId }))

    return this.presenter.toView(grant)
  }

  /**
   * @param userId - The user whose active grant to revoke.
   * @param actorUserId - The admin revoking it.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform admin.
   * @throws {PlatformRoleGrantNotFoundException} `userId` has no active grant.
   */
  async revokeRole(userId: string, actorUserId: string) {
    await this.policy.assertIsAdmin(actorUserId)

    await this.roleGrant.revoke(userId, actorUserId)

    this.logger.info({ userId, actorUserId }, 'Platform role revoked')
    void this.eventBus.publish(new PlatformRoleRevokedEvent({ userId, revokedById: actorUserId }))
  }

  /**
   * @param userId - The user to look up.
   * @param actorUserId - The admin performing the lookup.
   * @returns The user's active role view, or `null` if they have none.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform admin.
   */
  async getActiveRole(userId: string, actorUserId: string) {
    await this.policy.assertIsAdmin(actorUserId)

    const role = await this.roleGrant.getActiveRole(userId)

    return this.presenter.toActiveRoleView(role)
  }
}
