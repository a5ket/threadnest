import { BaseEvent } from './base.event'

export abstract class EventBus {
  abstract publish(event: BaseEvent): Promise<void>
}