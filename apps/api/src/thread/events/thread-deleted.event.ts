import { BaseEvent } from 'src/event/base.event'

export class ThreadDeletedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      threadId: string
      title: string
      slug: string
      nestId: string
      nestSlug: string
      nestName: string
      authorId: string
      deletedById: string
      // Null on self-delete (authorId === deletedById) — no "your content was removed"
      // notification for removing your own thread.
      recipientId: string | null
    }
  ) { super() }
}
