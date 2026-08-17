import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { MemberRoleChangedEvent } from 'src/nest/member/events/member-role-changed.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class MemberRoleChangedActionLogSubscriber extends NestActionLogEventSubscriber<MemberRoleChangedEvent> {
  readonly eventClass = MemberRoleChangedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: MemberRoleChangedEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.actorUserId, props.targetUserId, NestActionType.MEMBER_ROLE_CHANGED, {
      newRole: props.newRole
    })
  }
}
