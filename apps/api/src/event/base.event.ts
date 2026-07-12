export abstract class BaseEvent {
  readonly occurredAt = new Date()
  readonly type: string

  constructor() {
    this.type = this.constructor.name
      .replace(/Event$/, '')
      .replace(/([A-Z])/g, (char, _, offset) => (offset > 0 ? ':' : '') + char.toLowerCase())
  }
}
