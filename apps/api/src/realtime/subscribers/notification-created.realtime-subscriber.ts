import { Injectable } from '@nestjs/common'
import { EventSubscriber } from 'src/event/event-subscriber'
import { NotificationCreatedEvent } from 'src/notification/events/notification-created.event'
import { RealtimeGateway, userRoom } from '../realtime.gateway'

@Injectable()
export class NotificationCreatedRealtimeSubscriber extends EventSubscriber<NotificationCreatedEvent> {
  readonly eventClass = NotificationCreatedEvent
  readonly groupName = 'realtime'

  constructor(private readonly gateway: RealtimeGateway) { super() }

  async handle(event: NotificationCreatedEvent) {
    const { userId, notification } = event.props

    this.gateway.server.to(userRoom(userId)).emit('notification:created', notification)
  }
}
