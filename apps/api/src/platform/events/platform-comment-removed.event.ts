import { BaseEvent } from 'src/event/base.event'

export class PlatformCommentRemovedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      commentId: string
      commentExcerpt: string
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
