import { BaseEvent } from './base.event'

/**
 * Abstract publish side of the domain-event system — domain services depend on this rather than
 * a concrete implementation directly, so tests can substitute a mock without touching Redis.
 */
export abstract class EventBus {
  abstract publish(event: BaseEvent): Promise<void>
}