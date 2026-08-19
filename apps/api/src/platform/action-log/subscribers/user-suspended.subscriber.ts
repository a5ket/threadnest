import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformUserSuspendedEvent } from '../../events/platform-user-suspended.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformUserSuspendedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformUserSuspendedEvent> {
  readonly eventClass = PlatformUserSuspendedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformUserSuspendedEvent) {
    const { props } = event

    await this.actionLogs.create(props.suspendedById, props.userId, null, PlatformActionType.USER_SUSPENDED, {
      reason: props.reason
    })
  }
}
