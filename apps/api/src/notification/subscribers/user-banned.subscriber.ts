import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { UserBannedEvent } from 'src/nest/ban/events/user-banned.event'
import { NotificationEventSubscriber } from '../notification-event-subscriber'
import { NotificationService } from '../notification.service'

@Injectable()
export class UserBannedNotificationSubscriber extends NotificationEventSubscriber<UserBannedEvent> {
  readonly eventClass = UserBannedEvent

  constructor(private readonly notifications: NotificationService) { super() }

  async handle(event: UserBannedEvent) {
    const { props } = event

    await this.notifications.create(props.userId, props.bannedById, props.nestId, NotificationType.BANNED_FROM_NEST, {
      nestSlug: props.nestSlug,
      nestName: props.nestName,
      reason: props.reason
    })
  }
}
