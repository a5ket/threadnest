import { BaseEvent } from 'src/event/base.event'

export class OwnershipTransferredEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      nestSlug: string
      nestName: string
      previousOwnerId: string
      newOwnerId: string
    }
  ) { super() }
}
