import { BaseEvent } from 'src/event/base.event'
import { PlatformRole } from 'generated/prisma/enums'

export class PlatformRoleGrantedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      userId: string
      role: PlatformRole
      grantedById: string
    }
  ) { super() }
}
