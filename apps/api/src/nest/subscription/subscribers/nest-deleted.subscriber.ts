import { Injectable } from '@nestjs/common'
import { EventSubscriber } from 'src/event/event-subscriber'
import { NestDeletedEvent } from 'src/nest/events/nest-deleted.event'
import { NestSubscriptionService } from '../nest-subscription.service'

@Injectable()
export class NestDeletedSubscriptionSubscriber extends EventSubscriber<NestDeletedEvent> {
  readonly eventClass = NestDeletedEvent
  readonly groupName = 'nest-subscription'

  constructor(private readonly subscriptions: NestSubscriptionService) { super() }

  async handle(event: NestDeletedEvent) {
    await this.subscriptions.cancelAllForNest(event.props.nestId)
  }
}
