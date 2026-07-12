import { BaseEvent } from 'src/event/base.event'

export class CommentDeletedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      commentId: string
      threadId: string
      deletedById: string
    }
  ) { super() }
}
