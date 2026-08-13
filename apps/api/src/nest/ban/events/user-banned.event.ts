import { BaseEvent } from 'src/event/base.event'

export class UserBannedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      nestSlug: string
      nestName: string
      userId: string
      bannedById: string
      reason: string | null
    }
  ) { super() }
}
