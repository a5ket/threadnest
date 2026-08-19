import { BaseEvent } from 'src/event/base.event'

export class PlatformRoleRevokedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      revokedById: string
    }
  ) { super() }
}
