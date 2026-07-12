import { BaseEvent } from 'src/event/base.event'

export class UserUnbannedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      userId: string
      unbannedById: string
    }
  ) { super() }
}
