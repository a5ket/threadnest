import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { PlatformAccess } from '../platform.access'

@Injectable()
export class PlatformContentPolicy {
  constructor(
    private readonly platformAccess: PlatformAccess
  ) { }

  /**
   * @param actorUserId - The user attempting a platform-level content moderation action.
   * @throws {InsufficientPermissionsException} Not a platform moderator or admin.
   */
  async assertIsModerator(actorUserId: string) {
    const ctx = await this.platformAccess.getContext(actorUserId)

    if (!ctx.isModerator) {
      throw new InsufficientPermissionsException()
    }
  }
}
