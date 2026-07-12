import { BaseEvent } from 'src/event/base.event'

export class ThreadPinnedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      threadId: string
      nestId: string
      userId: string
    }
  ) { super() }
}
