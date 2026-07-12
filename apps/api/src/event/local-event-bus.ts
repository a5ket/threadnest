import { Injectable, Logger } from '@nestjs/common'
import { BaseEvent } from './base.event'
import { EventBus } from './event-bus'

@Injectable()
export class LocalEventBus extends EventBus {
  private readonly logger = new Logger(LocalEventBus.name)

  publish(event: BaseEvent): Promise<void> {
    this.logger.debug(`[${event.type}] ${JSON.stringify(event)}`)
    return Promise.resolve()
  }
}