import { BaseEvent } from 'src/event/base.event'

export class InviteAcceptedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      inviteId: string
      nestId: string
      userId: string
    }
  ) { super() }
}
