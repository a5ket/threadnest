import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { MessageSummary } from './types/message.summary'

@Injectable()
export class MessagePresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  toView(message: MessageSummary) {
    return {
      id: message.id,
      chatId: message.chatId,
      content: message.deletedAt ? null : message.content,
      sender: this.userPresenter.toReferenceView(message.sender),
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
