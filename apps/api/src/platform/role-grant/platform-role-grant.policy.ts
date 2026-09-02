import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { PlatformAccess } from '../platform.access'

@Injectable()
export class PlatformRoleGrantPolicy {
  constructor(
    private readonly platformAccess: PlatformAccess
  ) { }

  /**
   * @param actorUserId - The user attempting a platform role-grant action.
   * @throws {InsufficientPermissionsException} Not a platform admin — moderators cannot manage roles.
   */
  async assertIsAdmin(actorUserId: string) {
    const ctx = await this.platformAccess.getContext(actorUserId)

    if (!ctx.isAdmin) {
      throw new InsufficientPermissionsException()
    }
  }
}