export abstract class BaseEvent {
  readonly occurredAt = new Date()
  readonly type: string
  abstract readonly props: unknown

  static typeOf(eventClass: new (...args: any[]) => BaseEvent): string {
    return eventClass.name
      .replace(/Event$/, '')
      .replace(/([A-Z])/g, (char, _, offset) => (offset > 0 ? ':' : '') + char.toLowerCase())
  }

  constructor() {
    this.type = BaseEvent.typeOf(this.constructor as new (...args: any[]) => BaseEvent)
  }
}
