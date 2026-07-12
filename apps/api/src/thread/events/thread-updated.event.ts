import { BaseEvent } from 'src/event/base.event'

export class ThreadUpdatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      threadId: string
      nestId: string
      userId: string
      title: string
    }
  ) { super() }
}
