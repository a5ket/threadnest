import { Injectable } from '@nestjs/common'
import { ChatReadEvent } from 'src/chat/events/chat-read.event'
import { EventSubscriber } from 'src/event/event-subscriber'
import { chatRoom, RealtimeGateway } from '../realtime.gateway'

@Injectable()
export class ChatReadRealtimeSubscriber extends EventSubscriber<ChatReadEvent> {
  readonly eventClass = ChatReadEvent
  readonly groupName = 'realtime'

  constructor(private readonly gateway: RealtimeGateway) { super() }

  async handle(event: ChatReadEvent) {
    const { chatId, userId, at } = event.props

    this.gateway.emitToRoom(chatRoom(chatId), 'chat:read', { chatId, userId, at })
  }
}
