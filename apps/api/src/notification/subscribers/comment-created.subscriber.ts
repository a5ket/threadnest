import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { CommentCreatedEvent } from 'src/comment/events/comment-created.event'
import { NotificationEventSubscriber } from '../notification-event-subscriber'
import { toExcerpt } from 'src/common/text-excerpt'
import { NotificationService } from '../notification.service'

@Injectable()
export class CommentCreatedNotificationSubscriber extends NotificationEventSubscriber<CommentCreatedEvent> {
  readonly eventClass = CommentCreatedEvent

  constructor(private readonly notifications: NotificationService) { super() }

  async handle(event: CommentCreatedEvent) {
    const { props } = event

    if (!props.recipientId) return

    const type = props.parentCommentId ? NotificationType.COMMENT_REPLY : NotificationType.THREAD_REPLY

    await this.notifications.create(props.recipientId, props.authorId, props.nestId, type, {
      nestSlug: props.nestSlug,
      nestName: props.nestName,
      threadSlug: props.threadSlug,
      threadTitle: props.threadTitle,
      commentId: props.commentId,
      commentExcerpt: toExcerpt(props.content)
    })
  }
}
