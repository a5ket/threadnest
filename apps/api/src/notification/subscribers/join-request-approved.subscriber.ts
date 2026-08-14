import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { NestJoinRequestApprovedEvent } from 'src/nest/join-request/events/nest-join-request-approved.event'
import { NotificationEventSubscriber } from '../notification-event-subscriber'
import { NotificationService } from '../notification.service'

@Injectable()
export class JoinRequestApprovedNotificationSubscriber extends NotificationEventSubscriber<NestJoinRequestApprovedEvent> {
  readonly eventClass = NestJoinRequestApprovedEvent

  constructor(private readonly notifications: NotificationService) { super() }

  async handle(event: NestJoinRequestApprovedEvent) {
    const { props } = event

    await this.notifications.create(props.userId, props.approvedById, props.nestId, NotificationType.JOIN_REQUEST_APPROVED, {
      nestSlug: props.nestSlug,
      nestName: props.nestName
    })
  }
}
