import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { ThreadDeletedEvent } from 'src/thread/events/thread-deleted.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class ThreadRemovedActionLogSubscriber extends NestActionLogEventSubscriber<ThreadDeletedEvent> {
  readonly eventClass = ThreadDeletedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: ThreadDeletedEvent) {
    const { props } = event

    // recipientId is null on self-delete — not a moderation action worth logging.
    if (!props.recipientId) return

    await this.actionLogs.create(props.nestId, props.deletedById, props.authorId, NestActionType.THREAD_REMOVED, {
      threadSlug: props.slug,
      threadTitle: props.title
    })
  }
}
