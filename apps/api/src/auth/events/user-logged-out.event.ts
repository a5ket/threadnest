import { BaseEvent } from 'src/event/base.event'

export class UserLoggedOutEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      sessionId: string
    }
  ) { super() }
}
