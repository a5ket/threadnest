import { BaseEvent } from './base.event'

// groupName is a per-stream consumer group; subscribers can reuse the same name without competing.
export abstract class EventSubscriber<T extends BaseEvent = BaseEvent> {
  abstract readonly eventClass: new (props: T['props']) => T
  abstract readonly groupName: string
  abstract handle(event: T): Promise<void>
}
