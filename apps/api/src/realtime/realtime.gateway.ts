import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { DefaultEventsMap, Server, Socket } from 'socket.io'
import { AccessTokenPayload } from 'src/common/types/access.token.payload'
import { ChatPolicy } from 'src/chat/chat.policy'
import { ChatRepository } from 'src/chat/chat.repository'
import { SecurityConfig } from 'src/security/security.config'
import { extractSocketAccessToken } from './realtime-auth.util'

export function userRoom(userId: string) {
  return `user:${userId}`
}

export function chatRoom(chatId: string) {
  return `chat:${chatId}`
}

type RealtimeSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, { userId: string }>

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name)

  @WebSocketServer()
  server!: Server

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<SecurityConfig>,
    private readonly chatRepo: ChatRepository,
    private readonly chatPolicy: ChatPolicy,
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

  // Authorized the same way the REST chat endpoints are — a socket can only join rooms for
  // chats it's actually a participant of, so message pushes never leak into the wrong client.
  @SubscribeMessage('chat:join')
  async onChatJoin(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: { chatId?: string }) {
    if (!body?.chatId) {
      return { ok: false, error: 'chatId is required' }
    }

    try {
      const subject = await this.chatRepo.getById(body.chatId)
      await this.chatPolicy.assertCanViewChat(subject, client.data.userId)
    } catch {
      return { ok: false, error: 'not found' }
    }

    await client.join(chatRoom(body.chatId))
    return { ok: true }
  }

  @SubscribeMessage('chat:leave')
  async onChatLeave(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: { chatId?: string }) {
    if (body?.chatId) {
      await client.leave(chatRoom(body.chatId))
    }

    return { ok: true }
  }

  @SubscribeMessage('chat:typing:start')
  onTypingStart(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: { chatId?: string }) {
    this.broadcastTyping(client, body?.chatId, 'chat:typing:start')
  }

  @SubscribeMessage('chat:typing:stop')
  onTypingStop(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: { chatId?: string }) {
    this.broadcastTyping(client, body?.chatId, 'chat:typing:stop')
  }

  private broadcastTyping(client: RealtimeSocket, chatId: string | undefined, event: 'chat:typing:start' | 'chat:typing:stop') {
    if (!chatId || !client.rooms.has(chatRoom(chatId))) {
      return
    }

    client.to(chatRoom(chatId)).emit(event, { chatId, userId: client.data.userId })
  }

  emitToRoom(room: string, event: string, payload: unknown) {
    if (!this.server) return

    this.server.to(room).emit(event, payload)
  }
}
