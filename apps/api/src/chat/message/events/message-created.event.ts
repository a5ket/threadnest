import { BaseEvent } from 'src/event/base.event'
import { MessageResponseDto } from 'src/chat/message/dto/message-response.dto'

export class MessageCreatedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      chatId: string
      message: MessageResponseDto
    }
  ) { super() }
}
