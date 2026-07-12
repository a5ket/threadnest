import { BaseEvent } from 'src/event/base.event'

export class EmailVerifiedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
    }
  ) { super() }
}
