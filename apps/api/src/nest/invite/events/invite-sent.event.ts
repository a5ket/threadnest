import { BaseEvent } from 'src/event/base.event'

export class InviteSentEvent extends BaseEvent {
  constructor(
    public readonly props: {
      inviteId: string
      nestId: string
      userId: string
      invitedById: string
    }
  ) { super() }
}
