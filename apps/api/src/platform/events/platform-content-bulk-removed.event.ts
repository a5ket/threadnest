import { BaseEvent } from 'src/event/base.event'

export class PlatformContentBulkRemovedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      threadsRemoved: number
      commentsRemoved: number
      removedById: string
    }
  ) { super() }
}
