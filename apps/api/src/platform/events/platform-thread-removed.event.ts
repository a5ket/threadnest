import { BaseEvent } from 'src/event/base.event'

export class PlatformThreadRemovedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      threadId: string
      threadSlug: string
      threadTitle: string
      nestId: string
      nestSlug: string
      nestName: string
      authorId: string
      removedById: string
    }
  ) { super() }
}
