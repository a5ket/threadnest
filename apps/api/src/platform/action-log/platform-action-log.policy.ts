import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { PlatformAccess } from '../platform.access'

@Injectable()
export class PlatformActionLogPolicy {
  constructor(private readonly platformAccess: PlatformAccess) { }

  async assertCanViewActionLog(actorUserId: string) {
    const ctx = await this.platformAccess.getContext(actorUserId)

    if (!ctx.isModerator) {
      throw new InsufficientPermissionsException()
    }
  }
}
