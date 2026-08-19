import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformRoleGrantedEvent } from '../../events/platform-role-granted.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformRoleGrantedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformRoleGrantedEvent> {
  readonly eventClass = PlatformRoleGrantedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformRoleGrantedEvent) {
    const { props } = event

    await this.actionLogs.create(props.grantedById, props.userId, null, PlatformActionType.ROLE_GRANTED, {
      role: props.role
    })
  }
}
