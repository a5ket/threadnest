import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ChatPolicy } from '../chat.policy'
import { ChatRepository } from '../chat.repository'
import { ChatReadEvent } from '../events/chat-read.event'
import { MessageNotFoundException } from '../exceptions/message-not-found.exception'
import { ReplyTargetNotInChatException } from '../exceptions/reply-target-not-in-chat.exception'
import { MessageCreateDto } from './dto/message-create.dto'
import { MessageQueryDto } from './dto/message.query.dto'
import { MessageCreatedEvent } from './events/message-created.event'
import { MessagePresenter } from './message.presenter'
import { MessageRepository } from './message.repository'

@Injectable()
export class MessageService {
  constructor(
    private readonly messagesRepo: MessageRepository,
    private readonly chatsRepo: ChatRepository,
    private readonly chatPolicy: ChatPolicy,
    private readonly presenter: MessagePresenter,
    private readonly eventBus: EventBus,
  ) { }

  /**
   * Lists messages sent after the viewer's clear cutoff (if any), and marks the chat as read for
   * them as a side effect — viewing a chat's messages implies reading them. A read receipt event
   * is only published when this call actually advanced the viewer's read state, so re-opening an
   * already-read chat is a silent no-op.
   *
   * @param actorUserId - The viewer.
   * @param chatId - The chat to list messages from.
   * @param query - Pagination options.
   * @returns A page of messages, plus the read-state side effect described above.
   * @throws {ChatNotFoundException} The chat doesn't exist, or the viewer isn't a participant.
   */
  async listMessages(actorUserId: string, chatId: string, query: MessageQueryDto) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    const me = subject.participants.find((p) => p.userId === actorUserId)

    const at = new Date()
    const hadUnread = await this.chatsRepo.markRead(chatId, actorUserId, at)

    if (hadUnread) {
      void this.eventBus.publish(new ChatReadEvent({ chatId, userId: actorUserId, at }))
    }

    const page = await this.messagesRepo.list(chatId, me?.clearedAt ?? null, query)

    return { items: page.items.map((message) => this.presenter.toView(message)), meta: page.meta }
  }

  /**
   * Sends a message and marks the chat read for the sender up to that point, so sending a
   * message never leaves the sender's own chat looking unread. Publishes {@link MessageCreatedEvent}
   * (always) and {@link ChatReadEvent} (only if the sender actually had unread content before
   * sending, e.g. they were replying to unread messages).
   *
   * @param actorUserId - The sender.
   * @param chatId - The chat to send into.
   * @param dto - The message content and optional reply target.
   * @returns The created message's view.
   * @throws {ChatNotFoundException} The chat doesn't exist, or the sender isn't a participant.
   * @throws {CannotMessageBlockedUserException} Either side has blocked the other.
   * @throws {MessageNotFoundException} `dto.replyToId` doesn't exist.
   * @throws {ReplyTargetNotInChatException} `dto.replyToId` refers to a message in a different chat.
   */
  async sendMessage(actorUserId: string, chatId: string, dto: MessageCreateDto) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanSendMessage(subject, actorUserId)

    if (dto.replyToId) {
      const replyTarget = await this.messagesRepo.getById(dto.replyToId)

      if (replyTarget.chatId !== chatId) {
        throw new ReplyTargetNotInChatException()
      }
    }

    const message = await this.messagesRepo.create(chatId, actorUserId, dto)

    await this.chatsRepo.touchLastMessageAt(chatId, message.createdAt)
    const hadUnread = await this.chatsRepo.markRead(chatId, actorUserId, message.createdAt)

    const view = this.presenter.toView(message)

    void this.eventBus.publish(new MessageCreatedEvent({ chatId, message: view }))

    if (hadUnread) {
      void this.eventBus.publish(new ChatReadEvent({ chatId, userId: actorUserId, at: message.createdAt }))
    }

    return view
  }

  /**
   * @param actorUserId - The user requesting deletion; must be the message's sender.
   * @param chatId - The chat the message belongs to.
   * @param messageId - The message to delete.
   * @throws {ChatNotFoundException} The chat doesn't exist, or the actor isn't a participant.
   * @throws {MessageNotFoundException} No such message, or it belongs to a different chat.
   * @throws {InsufficientPermissionsException} The actor isn't the message's sender.
   */
  async deleteMessage(actorUserId: string, chatId: string, messageId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    const message = await this.messagesRepo.getById(messageId)

    if (message.chatId !== chatId) {
      throw new MessageNotFoundException()
    }

    if (message.senderId !== actorUserId) {
      throw new InsufficientPermissionsException()
    }

    await this.messagesRepo.softDelete(messageId, actorUserId)
  }
}
