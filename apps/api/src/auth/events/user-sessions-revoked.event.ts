import { BaseEvent } from 'src/event/base.event'

export class UserSessionsRevokedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
    }
  ) { super() }
}
