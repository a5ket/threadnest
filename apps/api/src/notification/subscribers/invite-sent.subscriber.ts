import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { InviteSentEvent } from 'src/nest/invite/events/invite-sent.event'
import { NotificationEventSubscriber } from '../notification-event-subscriber'
import { NotificationService } from '../notification.service'

@Injectable()
export class InviteSentNotificationSubscriber extends NotificationEventSubscriber<InviteSentEvent> {
  readonly eventClass = InviteSentEvent

  constructor(private readonly notifications: NotificationService) { super() }

  async handle(event: InviteSentEvent) {
    const { props } = event

    await this.notifications.create(props.userId, props.invitedById, props.nestId, NotificationType.NEST_INVITE_RECEIVED, {
      nestSlug: props.nestSlug,
      nestName: props.nestName,
      message: props.message
    })
  }
}
