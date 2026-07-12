import { BaseEvent } from 'src/event/base.event'

export class NestJoinRequestApprovedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      requestId: string
      nestId: string
      userId: string
      approvedById: string
    }
  ) { super() }
}
