import { BaseEvent } from 'src/event/base.event'

export class SessionRefreshedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      sessionId: string
    }
  ) { super() }
}
