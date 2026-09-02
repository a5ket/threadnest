import { BaseEvent } from 'src/event/base.event'
import { EventSubscriber } from 'src/event/event-subscriber'

/**
 * Base class for the subscribers that translate platform-level domain events (content removal,
 * report review, role/suspension changes) into {@link PlatformActionLogService.create} calls.
 * `groupName` is scoped per event stream, so every subscriber here reusing the same name is safe
 * — see {@link EventSubscriber}.
 */
export abstract class PlatformActionLogEventSubscriber<T extends BaseEvent = BaseEvent> extends EventSubscriber<T> {
  readonly groupName = 'platform-action-log'
}
