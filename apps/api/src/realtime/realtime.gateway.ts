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

/**
 * @param userId - The user whose personal room to identify.
 * @returns The Socket.IO room every one of that user's connected sockets joins on connect — the
 * addressing target for pushing an event to all of a user's devices at once.
 */
export function userRoom(userId: string) {
  return `user:${userId}`
}

/**
 * @param chatId - The chat whose room to identify.
 * @returns The Socket.IO room a socket joins via `chat:join` after passing
 * {@link ChatPolicy.assertCanViewChat} — the addressing target for live messages/typing/read
 * receipts in that chat.
 */
export function chatRoom(chatId: string) {
  return `chat:${chatId}`
}

type RealtimeSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, { userId: string }>

/**
 * Socket.IO gateway for live chat: connection auth, per-chat room membership, typing indicators,
 * and the `emitToRoom` entry point domain-event subscribers use to push server-initiated events
 * (new messages, read receipts, notifications) to connected clients.
 */
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

  /**
   * Verifies the connecting client's access token the same way {@link AuthGuard} does for REST
   * requests, then joins the socket to its {@link userRoom}. A missing or invalid/expired token
   * disconnects the socket immediately — there's no anonymous/unauthenticated realtime access.
   *
   * @param client - The newly connecting socket.
   */
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

  /**
   * Authorized the same way the REST chat endpoints are — a socket can only join rooms for chats
   * it's actually a participant of, so message pushes never leak into the wrong client.
   *
   * @param client - The joining socket.
   * @param body - The chat to join.
   * @returns `{ ok: true }` on success, or `{ ok: false, error }` if the request was malformed or
   * the client isn't a participant — the client's own concern to handle, not exception-based.
   */
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

  /**
   * @param client - The leaving socket.
   * @param body - The chat to leave. A missing/falsy `chatId` is a silent no-op.
   * @returns `{ ok: true }` — always succeeds, since leaving a room the socket was never in is harmless.
   */
  @SubscribeMessage('chat:leave')
  async onChatLeave(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: { chatId?: string }) {
    if (body?.chatId) {
      await client.leave(chatRoom(body.chatId))
    }

    return { ok: true }
  }

  /**
   * @param client - The socket that started typing.
   * @param body - The chat they're typing in.
   */
  @SubscribeMessage('chat:typing:start')
  onTypingStart(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: { chatId?: string }) {
    this.broadcastTyping(client, body?.chatId, 'chat:typing:start')
  }

  /**
   * @param client - The socket that stopped typing.
   * @param body - The chat they were typing in.
   */
  @SubscribeMessage('chat:typing:stop')
  onTypingStop(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: { chatId?: string }) {
    this.broadcastTyping(client, body?.chatId, 'chat:typing:stop')
  }

  /**
   * Broadcasts a typing event to everyone else in the chat room — never back to the sender. Only
   * broadcasts if the socket has actually joined the room via `chat:join`, so a client can't
   * spoof typing indicators for chats it was never authorized into.
   *
   * @param client - The socket reporting its typing state.
   * @param chatId - The chat the state applies to; a missing/unjoined chat is a silent no-op.
   * @param event - Which typing event to emit.
   */
  private broadcastTyping(client: RealtimeSocket, chatId: string | undefined, event: 'chat:typing:start' | 'chat:typing:stop') {
    if (!chatId || !client.rooms.has(chatRoom(chatId))) {
      return
    }

    client.to(chatRoom(chatId)).emit(event, { chatId, userId: client.data.userId })
  }

  /**
   * Server-initiated push: fans out an event to every socket in a room, for callers reacting to
   * something that happened elsewhere (e.g. a domain event) rather than to a message from the
   * room itself. Guards against `this.server` being unset, since Nest may construct the gateway
   * before Socket.IO has finished attaching the server instance.
   *
   * @param room - The target room — see {@link userRoom}/{@link chatRoom}.
   * @param event - The Socket.IO event name to emit.
   * @param payload - The event payload.
   */
  emitToRoom(room: string, event: string, payload: unknown) {
    if (!this.server) return

    this.server.to(room).emit(event, payload)
  }
}
