import { BaseEvent } from 'src/event/base.event'

export class NestJoinRequestRejectedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      requestId: string
      nestId: string
      userId: string
      rejectedById: string
    }
  ) { super() }
}
