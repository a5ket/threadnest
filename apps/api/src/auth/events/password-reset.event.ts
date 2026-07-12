import { BaseEvent } from 'src/event/base.event'

export class PasswordResetEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
    }
  ) { super() }
}
