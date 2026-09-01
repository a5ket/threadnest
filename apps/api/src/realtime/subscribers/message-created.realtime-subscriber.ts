import { Injectable } from '@nestjs/common'
import { MessageCreatedEvent } from 'src/chat/message/events/message-created.event'
import { EventSubscriber } from 'src/event/event-subscriber'
import { chatRoom, RealtimeGateway } from '../realtime.gateway'

@Injectable()
export class MessageCreatedRealtimeSubscriber extends EventSubscriber<MessageCreatedEvent> {
  readonly eventClass = MessageCreatedEvent
  readonly groupName = 'realtime'

  constructor(private readonly gateway: RealtimeGateway) { super() }

  async handle(event: MessageCreatedEvent) {
    const { chatId, message } = event.props

    this.gateway.server.to(chatRoom(chatId)).emit('message:created', message)
  }
}
