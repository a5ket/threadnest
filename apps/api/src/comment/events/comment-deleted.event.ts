import { BaseEvent } from 'src/event/base.event'

export class CommentDeletedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      commentId: string
      content: string
      authorId: string
      deletedById: string
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
