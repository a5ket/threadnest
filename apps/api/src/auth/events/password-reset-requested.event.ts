import { BaseEvent } from 'src/event/base.event'

export class PasswordResetRequestedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      email: string
    }
  ) { super() }
}
