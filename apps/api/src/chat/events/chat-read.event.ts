import { BaseEvent } from 'src/event/base.event'

export class ChatReadEvent extends BaseEvent {
  constructor(
    public readonly props: {
      chatId: string
      userId: string
      at: Date
    }
  ) { super() }
}
