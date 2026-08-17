import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { UserUnbannedEvent } from 'src/nest/ban/events/user-unbanned.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class UserUnbannedActionLogSubscriber extends NestActionLogEventSubscriber<UserUnbannedEvent> {
  readonly eventClass = UserUnbannedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: UserUnbannedEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.unbannedById, props.userId, NestActionType.MEMBER_UNBANNED, {})
  }
}
