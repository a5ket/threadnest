import { Injectable } from '@nestjs/common'
import { NotificationType } from 'generated/prisma/enums'
import { OwnershipTransferredEvent } from 'src/nest/events/ownership-transferred.event'
import { NotificationEventSubscriber } from '../notification-event-subscriber'
import { NotificationService } from '../notification.service'

@Injectable()
export class OwnershipTransferredNotificationSubscriber extends NotificationEventSubscriber<OwnershipTransferredEvent> {
  readonly eventClass = OwnershipTransferredEvent

  constructor(private readonly notifications: NotificationService) { super() }

  async handle(event: OwnershipTransferredEvent) {
    const { props } = event

    await this.notifications.create(props.newOwnerId, props.previousOwnerId, props.nestId, NotificationType.OWNERSHIP_TRANSFERRED, {
      nestSlug: props.nestSlug,
      nestName: props.nestName
    })
  }
}
