import { BaseEvent } from 'src/event/base.event'

export class PlatformUserSuspendedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      reason: string
      suspendedById: string
    }
  ) { super() }
}
