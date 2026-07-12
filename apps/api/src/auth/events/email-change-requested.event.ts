import { BaseEvent } from 'src/event/base.event'

export class EmailChangeRequestedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      newEmail: string
    }
  ) { super() }
}
