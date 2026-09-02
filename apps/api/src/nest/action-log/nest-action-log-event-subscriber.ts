import { BaseEvent } from 'src/event/base.event'
import { EventSubscriber } from 'src/event/event-subscriber'

/**
 * Base class for the subscribers that translate domain events (ban, role change, settings
 * update, etc.) into {@link NestActionLogService.create} calls. `groupName` is scoped per event
 * stream, so every subscriber here reusing the same name is safe — see {@link EventSubscriber}.
 */
export abstract class NestActionLogEventSubscriber<T extends BaseEvent = BaseEvent> extends EventSubscriber<T> {
  readonly groupName = 'nest-action-log'
}
