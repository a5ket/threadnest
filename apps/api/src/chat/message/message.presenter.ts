import { Injectable } from '@nestjs/common'
import { MessageSummary } from './types/message.summary'

@Injectable()
export class MessagePresenter {
  toView(message: MessageSummary) {
    return {
      id: message.id,
      chatId: message.chatId,
      content: message.deletedAt ? null : message.content,
      sender: message.sender,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.deletedAt ? null : message.replyTo.content,
            senderId: message.replyTo.senderId,
          }
        : null,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
    }
  }
}
