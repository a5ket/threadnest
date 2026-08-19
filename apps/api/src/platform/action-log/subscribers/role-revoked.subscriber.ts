import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformRoleRevokedEvent } from '../../events/platform-role-revoked.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformRoleRevokedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformRoleRevokedEvent> {
  readonly eventClass = PlatformRoleRevokedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformRoleRevokedEvent) {
    const { props } = event

    await this.actionLogs.create(props.revokedById, props.userId, null, PlatformActionType.ROLE_REVOKED, {})
  }
}
