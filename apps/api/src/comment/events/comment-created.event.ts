import { BaseEvent } from 'src/event/base.event'

export class CommentCreatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      commentId: string
      content: string
      authorId: string
      parentCommentId: string | null
      recipientId: string | null
      threadId: string
      threadSlug: string
      threadTitle: string
      nestId: string
      nestSlug: string
      nestName: string
    }
  ) { super() }
}
