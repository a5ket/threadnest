import { BaseEvent } from 'src/event/base.event'
import { EventSubscriber } from 'src/event/event-subscriber'

/**
 * Base class for the subscribers that translate domain events (comment, invite, join-request,
 * ownership transfer, report resolution, ban) into {@link NotificationService.create} calls.
 * `groupName` is scoped per event stream, so every subscriber here reusing the same name is safe
 * — see {@link EventSubscriber}.
 */
export abstract class NotificationEventSubscriber<T extends BaseEvent = BaseEvent> extends EventSubscriber<T> {
  readonly groupName = 'notifications'
}
