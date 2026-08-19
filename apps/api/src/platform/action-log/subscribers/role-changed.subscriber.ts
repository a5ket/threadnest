import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformRoleChangedEvent } from '../../events/platform-role-changed.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformRoleChangedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformRoleChangedEvent> {
  readonly eventClass = PlatformRoleChangedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformRoleChangedEvent) {
    const { props } = event

    await this.actionLogs.create(props.changedById, props.userId, null, PlatformActionType.ROLE_CHANGED, {
      newRole: props.newRole
    })
  }
}
