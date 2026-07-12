import { BaseEvent } from 'src/event/base.event'

export class UserBlockedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      blockerId: string
      blockedId: string
    }
  ) { super() }
}
