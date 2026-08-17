import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { MemberRemovedEvent } from 'src/nest/member/events/member-removed.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class MemberRemovedActionLogSubscriber extends NestActionLogEventSubscriber<MemberRemovedEvent> {
  readonly eventClass = MemberRemovedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: MemberRemovedEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.actorUserId, props.targetUserId, NestActionType.MEMBER_REMOVED, {})
  }
}
