import { BaseEvent } from 'src/event/base.event'

export class CommentUpdatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      commentId: string
      threadId: string
      authorId: string
    }
  ) { super() }
}
