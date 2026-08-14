import { BaseEvent } from 'src/event/base.event'
import { EventSubscriber } from 'src/event/event-subscriber'

export abstract class NotificationEventSubscriber<T extends BaseEvent = BaseEvent> extends EventSubscriber<T> {
  readonly groupName = 'notifications'
}
