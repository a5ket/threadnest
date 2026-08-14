import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { EventConfig } from './event.config'

const KEY_PREFIX = 'threadnest:events:'

@Injectable()
export class RedisStreamService implements OnModuleDestroy {
  readonly commands: Redis

  constructor(private readonly config: ConfigService<EventConfig>) {
    this.commands = this.createConnection()
  }

  // ioredis's keyPrefix doesn't reliably apply to XGROUP/XREADGROUP's key args, so prefix explicitly.
  streamKey(type: string) {
    return `${KEY_PREFIX}${type}`
  }

  // XREADGROUP BLOCK ties up its connection, so each consumer loop needs its own.
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
