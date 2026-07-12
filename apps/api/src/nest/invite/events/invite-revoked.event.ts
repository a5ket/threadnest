import { BaseEvent } from 'src/event/base.event'

export class InviteRevokedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      inviteId: string
      nestId: string
      userId: string
      revokedById: string
    }
  ) { super() }
}
