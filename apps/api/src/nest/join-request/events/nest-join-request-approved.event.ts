import { BaseEvent } from 'src/event/base.event'

export class NestJoinRequestApprovedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      requestId: string
      nestId: string
      nestSlug: string
      nestName: string
      userId: string
      approvedById: string
    }
  ) { super() }
}
