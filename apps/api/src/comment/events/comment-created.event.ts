import { BaseEvent } from 'src/event/base.event'

export class CommentCreatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      commentId: string
      threadId: string
      authorId: string
      parentCommentId: string | null
    }
  ) { super() }
}
