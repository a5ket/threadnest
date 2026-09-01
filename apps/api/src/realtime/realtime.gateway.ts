import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { DefaultEventsMap, Server, Socket } from 'socket.io'
import { AccessTokenPayload } from 'src/common/types/access.token.payload'
import { SecurityConfig } from 'src/security/security.config'
import { extractSocketAccessToken } from './realtime-auth.util'

export function userRoom(userId: string) {
  return `user:${userId}`
}

// Socket's 4th type param is exactly the `.data` property's type — use it instead of an
// intersection (Socket.data is itself typed `any`, and `any & T` collapses back to `any`).
type RealtimeSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, { userId: string }>

// CORS is configured in RedisIoAdapter.createIOServer() instead of here — decorator options are
// evaluated at class-definition time, before ConfigModule has loaded .env, so webAppUrl isn't
// available yet at this point.
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name)

  @WebSocketServer()
  server!: Server

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<SecurityConfig>,
  ) { }

  async handleConnection(client: RealtimeSocket) {
    const token = extractSocketAccessToken(client)

    if (!token) {
      client.disconnect(true)
      return
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow('jwtAccessSecret', { infer: true })
      })

      client.data.userId = payload.sub
      await client.join(userRoom(payload.sub))
    } catch {
      this.logger.debug(`Rejected socket connection ${client.id}: invalid or expired token`)
      client.disconnect(true)
    }
  }
}
