import { Injectable, Logger } from '@nestjs/common'
import { BaseEvent } from './base.event'
import { EventBus } from './event-bus'
import { RedisStreamService } from './redis-stream.service'

// Caps each stream so it can't grow unbounded if a given event type ends up with no consumer group.
const MAX_STREAM_LENGTH = 10_000

@Injectable()
export class RedisEventBus extends EventBus {
  private readonly logger = new Logger(RedisEventBus.name)

  constructor(private readonly streams: RedisStreamService) { super() }

  async publish(event: BaseEvent): Promise<void> {
    await this.streams.commands.xadd(
      this.streams.streamKey(event.type),
      'MAXLEN', '~', MAX_STREAM_LENGTH,
      '*',
      'payload', JSON.stringify(event.props)
    )

    this.logger.debug(`[${event.type}] published`)
  }
}
