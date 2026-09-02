import { Injectable, Logger } from '@nestjs/common'
import { BaseEvent } from './base.event'
import { EventBus } from './event-bus'
import { RedisStreamService } from './redis-stream.service'

/** Caps each stream so it can't grow unbounded if a given event type ends up with no consumer group. */
const MAX_STREAM_LENGTH = 10_000

/** {@link EventBus} implementation backed by Redis Streams — see {@link RedisStreamService}. */
@Injectable()
export class RedisEventBus extends EventBus {
  private readonly logger = new Logger(RedisEventBus.name)

  constructor(private readonly streams: RedisStreamService) { super() }

  /**
   * Appends the event to its type's stream (`MAXLEN ~` is an approximate trim, not exact — cheap
   * to compute, close enough for a debug-log safety cap). Resolves once the append is durably
   * written to Redis; it does not wait for, or know about, any subscriber actually consuming it —
   * subscribers read the stream asynchronously via their own consumer groups.
   *
   * @param event - The event to publish.
   */
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
