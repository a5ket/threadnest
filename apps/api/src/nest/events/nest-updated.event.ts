import { BaseEvent } from 'src/event/base.event'

export class NestUpdatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      userId: string
      name: string
      description: string | null
    }
  ) { super() }
}
