import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { UserBannedEvent } from 'src/nest/ban/events/user-banned.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class UserBannedActionLogSubscriber extends NestActionLogEventSubscriber<UserBannedEvent> {
  readonly eventClass = UserBannedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: UserBannedEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.bannedById, props.userId, NestActionType.MEMBER_BANNED, {
      reason: props.reason
    })
  }
}
