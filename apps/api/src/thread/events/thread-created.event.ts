import { BaseEvent } from 'src/event/base.event'

export class ThreadCreatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      threadId: string
      nestId: string
      authorId: string
      slug: string
      title: string
    }
  ) { super() }
}
