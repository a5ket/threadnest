import { BaseEvent } from 'src/event/base.event'

export class MemberRemovedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      actorUserId: string
      targetUserId: string
    }
  ) { super() }
}
