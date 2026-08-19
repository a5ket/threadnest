import { BaseEvent } from 'src/event/base.event'
import { PlatformRole } from 'generated/prisma/enums'

export class PlatformRoleChangedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      newRole: PlatformRole
      changedById: string
    }
  ) { super() }
}
