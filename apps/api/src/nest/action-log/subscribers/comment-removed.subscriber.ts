import { Injectable } from '@nestjs/common'
import { toExcerpt } from 'src/common/text-excerpt'
import { NestActionType } from 'generated/prisma/enums'
import { CommentDeletedEvent } from 'src/comment/events/comment-deleted.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class CommentRemovedActionLogSubscriber extends NestActionLogEventSubscriber<CommentDeletedEvent> {
  readonly eventClass = CommentDeletedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: CommentDeletedEvent) {
    const { props } = event

    // recipientId is null on self-delete — not a moderation action worth logging.
    if (!props.recipientId) return

    await this.actionLogs.create(props.nestId, props.deletedById, props.authorId, NestActionType.COMMENT_REMOVED, {
      threadSlug: props.threadSlug,
      threadTitle: props.threadTitle,
      commentId: props.commentId,
      commentExcerpt: toExcerpt(props.content)
    })
  }
}
