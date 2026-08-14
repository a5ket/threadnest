import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { NestJoinRequestRejectedEvent } from 'src/nest/join-request/events/nest-join-request-rejected.event'
import { NotificationEventSubscriber } from '../notification-event-subscriber'
import { NotificationService } from '../notification.service'

@Injectable()
export class JoinRequestRejectedNotificationSubscriber extends NotificationEventSubscriber<NestJoinRequestRejectedEvent> {
  readonly eventClass = NestJoinRequestRejectedEvent

  constructor(private readonly notifications: NotificationService) { super() }

  async handle(event: NestJoinRequestRejectedEvent) {
    const { props } = event

    await this.notifications.create(props.userId, props.rejectedById, props.nestId, NotificationType.JOIN_REQUEST_REJECTED, {
      nestSlug: props.nestSlug,
      nestName: props.nestName
    })
  }
}
