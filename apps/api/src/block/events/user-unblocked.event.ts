import { BaseEvent } from 'src/event/base.event'

export class UserUnblockedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      blockerId: string
      blockedId: string
    }
  ) { super() }
}
