import { Injectable } from '@nestjs/common'
import { UserService } from 'src/user/user.service'
import { UserSuspensionCreateDto } from './dto/user-suspension-create.dto'
import { CannotSuspendYourselfException } from './exceptions/cannot-suspend-yourself.exception'
import { UserSuspensionRepository } from './user-suspension.repository'

/**
 * Pure user-domain CRUD for account suspensions — no awareness of platform roles. Callers (the
 * platform controller, auth login/refresh) are responsible for their own authorization.
 */
@Injectable()
export class UserSuspensionService {
  constructor(
    private readonly user: UserService,
    private readonly suspensions: UserSuspensionRepository
  ) { }

  /**
   * @param userId - The account to suspend.
   * @param actorUserId - The platform admin issuing the suspension.
   * @param dto - Suspension details (reason).
   * @throws {CannotSuspendYourselfException} The actor is targeting their own account.
   * @throws {UserNotFoundException} No such user.
   */
  async suspend(userId: string, actorUserId: string, dto: UserSuspensionCreateDto) {
    if (userId === actorUserId) {
      throw new CannotSuspendYourselfException()
    }

    await this.user.assertUserExists(userId)

    return this.suspensions.create(userId, actorUserId, dto)
  }

  /**
   * @param userId - The account to unsuspend.
   * @param actorUserId - The platform admin revoking the suspension.
   * @throws {UserSuspensionNotFoundException} No active suspension to revoke.
   */
  async unsuspend(userId: string, actorUserId: string) {
    await this.suspensions.revoke(userId, actorUserId)
  }

  /**
   * The user's currently active suspension, if any — checked on every login and refresh.
   *
   * @param userId - The account to check.
   */
  async getActive(userId: string) {
    return this.suspensions.getActive(userId)
  }
}
