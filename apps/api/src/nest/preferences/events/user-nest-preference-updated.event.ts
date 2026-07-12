import { BaseEvent } from 'src/event/base.event'

export class UserNestPreferenceUpdatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      nestId: string
      allowInvites: boolean
      muted: boolean
    }
  ) { super() }
}
