import { BaseEvent } from 'src/event/base.event'

export class UserBannedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      userId: string
      bannedById: string
    }
  ) { super() }
}
