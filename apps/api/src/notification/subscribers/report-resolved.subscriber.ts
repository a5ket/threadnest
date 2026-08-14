import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { ReportResolvedEvent } from 'src/report/events/report-resolved.event'
import { NotificationEventSubscriber } from '../notification-event-subscriber'
import { NotificationService } from '../notification.service'

@Injectable()
export class ReportResolvedNotificationSubscriber extends NotificationEventSubscriber<ReportResolvedEvent> {
  readonly eventClass = ReportResolvedEvent

  constructor(private readonly notifications: NotificationService) { super() }

  async handle(event: ReportResolvedEvent) {
    const { props } = event

    // A moderator resolving a report they filed themselves already knows the outcome.
    if (props.reporterId === props.resolvedById) return

    await this.notifications.create(props.reporterId, props.resolvedById, props.nestId, NotificationType.REPORT_RESOLVED, {
      nestSlug: props.nestSlug,
      nestName: props.nestName,
      threadSlug: props.threadSlug,
      threadTitle: props.threadTitle,
      status: props.status,
      targetType: props.targetType,
      commentId: props.commentId
    })
  }
}
