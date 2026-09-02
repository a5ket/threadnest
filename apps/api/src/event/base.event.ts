/**
 * Base class for every domain event published on the {@link EventBus}. Subclasses declare their
 * payload as a `props` field and need no other boilerplate — `type` and `occurredAt` are derived
 * automatically at construction time.
 */
export abstract class BaseEvent {
  readonly occurredAt = new Date()
  readonly type: string
  abstract readonly props: unknown

  /**
   * Derives an event's wire `type` string from its class name — PascalCase with a trailing
   * `Event` stripped, split into `snake:case` segments on capital letters. E.g.
   * `CommentCreatedEvent` becomes `comment:created`.
   *
   * @param eventClass - The event class (not an instance) to derive a type string for.
   * @returns The event's wire type string.
   */
  static typeOf(eventClass: new (...args: any[]) => BaseEvent): string {
    return eventClass.name
      .replace(/Event$/, '')
      .replace(/([A-Z])/g, (char, _, offset) => (offset > 0 ? ':' : '') + char.toLowerCase())
  }

  constructor() {
    this.type = BaseEvent.typeOf(this.constructor as new (...args: any[]) => BaseEvent)
  }
}
