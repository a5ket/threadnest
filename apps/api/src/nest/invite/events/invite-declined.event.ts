import { BaseEvent } from 'src/event/base.event'

export class InviteDeclinedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      inviteId: string
      nestId: string
      userId: string
    }
  ) { super() }
}
