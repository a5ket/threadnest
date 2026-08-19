import { Injectable } from '@nestjs/common'
import { BlockService } from 'src/block/block.service'
import { UserService } from 'src/user/user.service'
import { ChatAccess } from './chat.access'
import { ChatPolicy } from './chat.policy'
import { ChatPresenter } from './chat.presenter'
import { ChatRepository } from './chat.repository'
import { ChatQueryDto } from './dto/chat.query.dto'
import { CannotChatWithYourselfException } from './exceptions/cannot-chat-with-yourself.exception'
import { CannotMessageBlockedUserException } from './exceptions/cannot-message-blocked-user.exception'

@Injectable()
export class ChatService {
  constructor(
    private readonly chatsRepo: ChatRepository,
    private readonly users: UserService,
    private readonly blocks: BlockService,
    private readonly chatAccess: ChatAccess,
    private readonly chatPolicy: ChatPolicy,
    private readonly presenter: ChatPresenter,
  ) { }

  async startDirectChat(actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new CannotChatWithYourselfException()
    }

    await this.users.assertUserExists(targetUserId)

    const existing = await this.chatsRepo.findDirect(actorUserId, targetUserId)
    if (existing) {
      const ctx = await this.chatAccess.getContext(existing, actorUserId)
      return this.presenter.toDetailView(existing, actorUserId, ctx)
    }

    const [youBlockedThem, blockedByThem] = await Promise.all([
      this.blocks.exists(actorUserId, targetUserId),
      this.blocks.exists(targetUserId, actorUserId),
    ])

    if (youBlockedThem || blockedByThem) {
      throw new CannotMessageBlockedUserException()
    }

    const chat = await this.chatsRepo.createDirect(actorUserId, targetUserId)
    const ctx = await this.chatAccess.getContext(chat, actorUserId)

    return this.presenter.toDetailView(chat, actorUserId, ctx)
  }

  async getChat(actorUserId: string, chatId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    const ctx = await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    const chat = await this.chatsRepo.getSummaryById(chatId)

    return this.presenter.toDetailView(chat, actorUserId, ctx)
  }

  async listChats(actorUserId: string, query: ChatQueryDto) {
    const page = await this.chatsRepo.list(actorUserId, query)

    return { items: page.items.map((chat) => this.presenter.toSummaryView(chat, actorUserId)), meta: page.meta }
  }

  async getUnreadCount(actorUserId: string) {
    const candidates = await this.chatsRepo.listUnreadCandidates(actorUserId)

    return candidates.filter((participant) => {
      const lastMessageAt = participant.chat.lastMessageAt
      if (!lastMessageAt) return false
      if (participant.clearedAt && lastMessageAt <= participant.clearedAt) return false
      return !participant.lastReadAt || lastMessageAt > participant.lastReadAt
    }).length
  }

  async archiveChat(actorUserId: string, chatId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    await this.chatsRepo.setArchived(chatId, actorUserId, new Date())
  }

  async unarchiveChat(actorUserId: string, chatId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    await this.chatsRepo.setArchived(chatId, actorUserId, null)
  }

  async clearChat(actorUserId: string, chatId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    await this.chatsRepo.clear(chatId, actorUserId)
  }
}
