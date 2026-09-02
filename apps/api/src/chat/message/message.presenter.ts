import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { MessageSummary } from './types/message.summary'

/** Shapes a message row into its API response, nulling out content for deleted messages. */
@Injectable()
export class MessagePresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  /**
   * A deleted message keeps its row (id, sender, timestamps) but has its content nulled — this
   * applies to both the message itself and, independently, whatever it's replying to.
   *
   * @param message - The message to present.
   * @returns The message's view.
   */
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
