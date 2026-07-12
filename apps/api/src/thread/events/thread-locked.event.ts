import { BaseEvent } from 'src/event/base.event'

export class ThreadLockedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      threadId: string
      nestId: string
      userId: string
    }
  ) { super() }
}
