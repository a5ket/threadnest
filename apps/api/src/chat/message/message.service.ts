import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ChatPolicy } from '../chat.policy'
import { ChatRepository } from '../chat.repository'
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

  async listMessages(actorUserId: string, chatId: string, query: MessageQueryDto) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    const me = subject.participants.find((p) => p.userId === actorUserId)

    await this.chatsRepo.markRead(chatId, actorUserId)

    const page = await this.messagesRepo.list(chatId, me?.clearedAt ?? null, query)

    return { items: page.items.map((message) => this.presenter.toView(message)), meta: page.meta }
  }

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
    await this.chatsRepo.markRead(chatId, actorUserId, message.createdAt)

    const view = this.presenter.toView(message)

    void this.eventBus.publish(new MessageCreatedEvent({ chatId, message: view }))

    return view
  }

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
