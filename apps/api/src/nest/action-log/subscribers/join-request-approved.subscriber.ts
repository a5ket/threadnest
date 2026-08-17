import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { NestJoinRequestApprovedEvent } from 'src/nest/join-request/events/nest-join-request-approved.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class JoinRequestApprovedActionLogSubscriber extends NestActionLogEventSubscriber<NestJoinRequestApprovedEvent> {
  readonly eventClass = NestJoinRequestApprovedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: NestJoinRequestApprovedEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.approvedById, props.userId, NestActionType.JOIN_REQUEST_APPROVED, {})
  }
}
