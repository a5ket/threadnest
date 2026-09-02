import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { EventConfig } from './event.config'

const KEY_PREFIX = 'threadnest:events:'

/** Shared Redis connection factory and key-naming for the Redis Streams event bus. */
@Injectable()
export class RedisStreamService implements OnModuleDestroy {
  /** The shared connection, for one-off commands. */
  readonly commands: Redis

  constructor(private readonly config: ConfigService<EventConfig>) {
    this.commands = this.createConnection()
  }

  /**
   * ioredis's `keyPrefix` option doesn't reliably apply to `XGROUP`/`XREADGROUP`'s key
   * arguments, so every caller building a stream key prefixes explicitly through this method
   * instead of relying on connection-level prefixing.
   *
   * @param type - An event's wire type — see {@link BaseEvent.typeOf}.
   * @returns The Redis key for that event type's stream.
   */
  streamKey(type: string) {
    return `${KEY_PREFIX}${type}`
  }

  /**
   * A fresh connection, not the shared {@link commands} one — useful for callers running a
   * blocking command like `XREADGROUP BLOCK`, which ties up its connection while waiting for new
   * entries and so can't share a connection with anything else.
   *
   * @returns A new Redis client connected with the configured host/port.
   */
  createConnection() {
    return new Redis({
      host: this.config.getOrThrow('redisHost', { infer: true }),
      port: this.config.getOrThrow('redisPort', { infer: true })
    })
  }

  async onModuleDestroy() {
    await this.commands.quit()
  }
}
