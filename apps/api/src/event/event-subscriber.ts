import { BaseEvent } from './base.event'

/**
 * Base class for reacting to one domain event type via the Redis Streams event bus.
 *
 * `groupName` identifies this subscriber's Redis Streams consumer group *on `eventClass`'s own
 * stream* — it is not shared across event types, so unrelated subscribers can freely reuse the
 * same `groupName` string without their consumption competing. What it does control: two
 * subscribers for the *same* event class with the *same* `groupName` split that stream's
 * messages between them (load-balanced), while two different `groupName`s on the same stream
 * each get every message independently (fan-out).
 */
export abstract class EventSubscriber<T extends BaseEvent = BaseEvent> {
  abstract readonly eventClass: new (props: T['props']) => T
  abstract readonly groupName: string
  abstract handle(event: T): Promise<void>
}
