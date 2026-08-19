import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformUserUnsuspendedEvent } from '../../events/platform-user-unsuspended.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformUserUnsuspendedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformUserUnsuspendedEvent> {
  readonly eventClass = PlatformUserUnsuspendedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformUserUnsuspendedEvent) {
    const { props } = event

    await this.actionLogs.create(props.unsuspendedById, props.userId, null, PlatformActionType.USER_UNSUSPENDED, {})
  }
}
