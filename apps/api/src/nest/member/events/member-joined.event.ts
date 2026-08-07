import { BaseEvent } from 'src/event/base.event'

export class MemberJoinedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      userId: string
    }
  ) { super() }
}
