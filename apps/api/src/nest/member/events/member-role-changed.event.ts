import { NestMemberRole } from 'generated/prisma/enums'
import { BaseEvent } from 'src/event/base.event'

export class MemberRoleChangedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      actorUserId: string
      targetUserId: string
      newRole: NestMemberRole
    }
  ) { super() }
}
