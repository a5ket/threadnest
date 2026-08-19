import { Injectable } from '@nestjs/common'
import { UserService } from 'src/user/user.service'
import { UserSuspensionCreateDto } from './dto/user-suspension-create.dto'
import { CannotSuspendYourselfException } from './exceptions/cannot-suspend-yourself.exception'
import { UserSuspensionRepository } from './user-suspension.repository'

// Pure user-domain CRUD — no awareness of platform roles. Callers (the platform controller, auth login/refresh) are responsible for their own authorization.
@Injectable()
export class UserSuspensionService {
  constructor(
    private readonly user: UserService,
    private readonly suspensions: UserSuspensionRepository
  ) { }

  async suspend(userId: string, actorUserId: string, dto: UserSuspensionCreateDto) {
    if (userId === actorUserId) {
      throw new CannotSuspendYourselfException()
    }

    await this.user.assertUserExists(userId)

    return this.suspensions.create(userId, actorUserId, dto)
  }

  async unsuspend(userId: string, actorUserId: string) {
    await this.suspensions.revoke(userId, actorUserId)
  }

  async getActive(userId: string) {
    return this.suspensions.getActive(userId)
  }
}
