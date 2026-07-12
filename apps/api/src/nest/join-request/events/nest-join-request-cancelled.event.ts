import { BaseEvent } from 'src/event/base.event'

export class NestJoinRequestCancelledEvent extends BaseEvent {
  constructor(
    public readonly props: {
      requestId: string
      nestId: string
      userId: string
    }
  ) { super() }
}
