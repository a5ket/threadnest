import { BaseEvent } from 'src/event/base.event'

export class NestCreatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      nestId: string
      ownerId: string
      slug: string
      name: string
      description: string | null
    }
  ) { super() }
}
