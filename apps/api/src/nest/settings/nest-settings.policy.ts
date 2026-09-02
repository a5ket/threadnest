import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from '../nest.access'

@Injectable()
export class NestSettingsPolicy {
  constructor(
    private readonly nestAccess: NestAccess
  ) { }

  /** @throws {InsufficientPermissionsException} Not a moderator or above in this nest. */
  async assertCanViewSettings(nestId: string, actorUserId: string) {
    const access = await this.nestAccess.getContext(nestId, actorUserId)

    if (!access.canModerateContent) {
      throw new InsufficientPermissionsException()
    }
  }

  /** @throws {InsufficientPermissionsException} `actorUserId` isn't this nest's owner. */
  async assertCanUpdateSettings(nestId: string, actorUserId: string) {
    const access = await this.nestAccess.getContext(nestId, actorUserId)

    if (!access.canManageSettings) {
      throw new InsufficientPermissionsException()
    }
  }
}
