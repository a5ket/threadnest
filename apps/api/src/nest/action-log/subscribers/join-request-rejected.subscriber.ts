import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { NestJoinRequestRejectedEvent } from 'src/nest/join-request/events/nest-join-request-rejected.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class JoinRequestRejectedActionLogSubscriber extends NestActionLogEventSubscriber<NestJoinRequestRejectedEvent> {
  readonly eventClass = NestJoinRequestRejectedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: NestJoinRequestRejectedEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.rejectedById, props.userId, NestActionType.JOIN_REQUEST_REJECTED, {})
  }
}
