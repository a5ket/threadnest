import { INestApplicationContext } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { Server, ServerOptions } from 'socket.io'
import { EventConfig } from 'src/event/event.config'
import { UrlConfig } from 'src/url/url.config'

/**
 * Without this, a notification published from one PM2 instance never reaches a socket connected
 * to another — Socket.IO's default in-memory adapter only fans out within one process. Must be
 * constructed and have {@link connectToRedis} awaited (see `main.ts`) before
 * `app.useWebSocketAdapter(adapter)`, so the Redis pub/sub clients are ready before any socket connects.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>

  constructor(private readonly app: INestApplicationContext) {
    super(app)
  }

  /** Opens the Redis pub/sub client pair used to fan out Socket.IO events across instances. */
  async connectToRedis(): Promise<void> {
    const config = this.app.get(ConfigService<EventConfig>)

    const pubClient = new Redis({
      host: config.getOrThrow('redisHost', { infer: true }),
      port: config.getOrThrow('redisPort', { infer: true })
    })
    const subClient = pubClient.duplicate()

    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  /**
   * `@WebSocketGateway()`'s own `cors` option is evaluated at class-definition time, before
   * `ConfigModule` has loaded `.env` — so it can't read `webAppUrl` reliably. Set it here instead,
   * once `ConfigService` is actually available, and let it win over whatever the gateway passed in.
   *
   * @param port - The port to bind the Socket.IO server to.
   * @param options - Base Socket.IO server options; `cors` is overridden.
   * @returns The configured Socket.IO server, with the Redis adapter attached if
   * {@link connectToRedis} was called first.
   */
  createIOServer(port: number, options?: ServerOptions): Server {
    const config = this.app.get(ConfigService<UrlConfig>)

    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: config.getOrThrow('webAppUrl', { infer: true }), credentials: true }
    }) as Server

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor)
    }

    return server
  }
}
