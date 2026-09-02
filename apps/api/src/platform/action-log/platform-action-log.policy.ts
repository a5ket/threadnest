import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { PlatformAccess } from '../platform.access'

@Injectable()
export class PlatformActionLogPolicy {
  constructor(private readonly platformAccess: PlatformAccess) { }

  /**
   * @param actorUserId - The user attempting to view the platform action log.
   * @throws {InsufficientPermissionsException} Not a platform moderator or admin.
   */
  async assertCanViewActionLog(actorUserId: string) {
    const ctx = await this.platformAccess.getContext(actorUserId)

    if (!ctx.isModerator) {
      throw new InsufficientPermissionsException()
    }
  }
}
