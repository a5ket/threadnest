import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from '../nest.access'

@Injectable()
export class NestActionLogPolicy {
  constructor(private readonly nestAccess: NestAccess) { }

  /** @throws {InsufficientPermissionsException} Not a moderator or above in this nest. */
  async assertCanViewActionLog(nestId: string, actorUserId: string) {
    const access = await this.nestAccess.getContext(nestId, actorUserId)

    if (!access.canViewActionLog) {
      throw new InsufficientPermissionsException()
    }
  }
}
