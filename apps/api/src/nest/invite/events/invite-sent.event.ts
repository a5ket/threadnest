import { BaseEvent } from 'src/event/base.event'

export class InviteSentEvent extends BaseEvent {
  constructor(
    public readonly props: {
      inviteId: string
      nestId: string
      nestSlug: string
      nestName: string
      userId: string
      invitedById: string
      message: string | null
    }
  ) { super() }
}
