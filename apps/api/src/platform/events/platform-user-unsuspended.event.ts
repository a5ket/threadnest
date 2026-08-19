import { BaseEvent } from 'src/event/base.event'

export class PlatformUserUnsuspendedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      unsuspendedById: string
    }
  ) { super() }
}
