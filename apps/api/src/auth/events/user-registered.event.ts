import { BaseEvent } from 'src/event/base.event'

export class UserRegisteredEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      email: string
    }
  ) { super() }
}
