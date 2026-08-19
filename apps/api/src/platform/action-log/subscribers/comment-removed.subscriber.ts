import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformCommentRemovedEvent } from '../../events/platform-comment-removed.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformCommentRemovedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformCommentRemovedEvent> {
  readonly eventClass = PlatformCommentRemovedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformCommentRemovedEvent) {
    const { props } = event

    await this.actionLogs.create(props.removedById, props.authorId, props.nestId, PlatformActionType.COMMENT_REMOVED, {
      commentId: props.commentId,
      commentExcerpt: props.commentExcerpt,
      threadSlug: props.threadSlug,
      threadTitle: props.threadTitle,
      nestSlug: props.nestSlug,
      nestName: props.nestName
    })
  }
}
