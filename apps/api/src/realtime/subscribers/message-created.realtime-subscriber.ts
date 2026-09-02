import { Injectable } from '@nestjs/common'
import { MessageCreatedEvent } from 'src/chat/message/events/message-created.event'
import { EventSubscriber } from 'src/event/event-subscriber'
import { chatRoom, RealtimeGateway } from '../realtime.gateway'

/** Pushes a newly sent chat message live to every socket in that chat's room. */
@Injectable()
export class MessageCreatedRealtimeSubscriber extends EventSubscriber<MessageCreatedEvent> {
  readonly eventClass = MessageCreatedEvent
  readonly groupName = 'realtime'

  constructor(private readonly gateway: RealtimeGateway) { super() }

  async handle(event: MessageCreatedEvent) {
    const { chatId, message } = event.props

    this.gateway.emitToRoom(chatRoom(chatId), 'message:created', message)
  }
}
