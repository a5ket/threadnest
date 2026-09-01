import { BaseEvent } from 'src/event/base.event'
import { NotificationResponseDto } from 'src/notification/dto/notification-response.dto'

export class NotificationCreatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      notification: NotificationResponseDto
    }
  ) { super() }
}
