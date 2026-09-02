import { Injectable } from '@nestjs/common'
import { EventSubscriber } from 'src/event/event-subscriber'
import { NotificationCreatedEvent } from 'src/notification/events/notification-created.event'
import { RealtimeGateway, userRoom } from '../realtime.gateway'

/** Pushes a newly created notification live to the recipient's connected sockets. */
@Injectable()
export class NotificationCreatedRealtimeSubscriber extends EventSubscriber<NotificationCreatedEvent> {
  readonly eventClass = NotificationCreatedEvent
  readonly groupName = 'realtime'

  constructor(private readonly gateway: RealtimeGateway) { super() }

  async handle(event: NotificationCreatedEvent) {
    const { userId, notification } = event.props

    this.gateway.emitToRoom(userRoom(userId), 'notification:created', notification)
  }
}
