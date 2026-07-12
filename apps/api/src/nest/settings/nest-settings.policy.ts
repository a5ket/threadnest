import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from '../nest.access'

@Injectable()
export class NestSettingsPolicy {
  constructor(
    private readonly nestAccess: NestAccess
  ) { }

  async assertCanViewSettings(nestId: string, actorUserId: string) {
    await this.assertCanManageSettings(nestId, actorUserId)
  }

  async assertCanUpdateSettings(nestId: string, actorUserId: string) {
    await this.assertCanManageSettings(nestId, actorUserId)
  }

  private async assertCanManageSettings(nestId: string, actorUserId: string) {
    const access = await this.nestAccess.getContext(nestId, actorUserId)

    if (!access.canManageSettings) {
      throw new InsufficientPermissionsException()
    }
  }
}