import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from '../nest.access'

@Injectable()
export class NestPayoutPolicy {
  constructor(
    private readonly nestAccess: NestAccess
  ) { }

  /** @throws {InsufficientPermissionsException} `actorUserId` isn't this nest's owner. */
  async assertCanManage(nestId: string, actorUserId: string) {
    const access = await this.nestAccess.getContext(nestId, actorUserId)

    if (!access.isOwner) {
      throw new InsufficientPermissionsException()
    }
  }
}
