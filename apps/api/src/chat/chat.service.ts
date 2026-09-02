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

  /**
   * Gets or creates the 1:1 chat between two users. Idempotent: if a direct chat between them
   * already exists, returns it as-is rather than erroring or creating a duplicate.
   *
   * @param actorUserId - The user initiating the chat.
   * @param targetUserId - The other participant.
   * @returns The chat's detail view.
   * @throws {CannotChatWithYourselfException} `actorUserId` equals `targetUserId`.
   * @throws {UserNotFoundException} `targetUserId` does not exist.
   * @throws {CannotMessageBlockedUserException} Either side has blocked the other and no chat
   * between them exists yet.
   */
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

  /**
   * @param actorUserId - The viewer.
   * @param chatId - The chat to fetch.
   * @returns The chat's detail view.
   * @throws {ChatNotFoundException} The chat doesn't exist, or the viewer isn't a participant.
   */
  async getChat(actorUserId: string, chatId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    const ctx = await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    const chat = await this.chatsRepo.getSummaryById(chatId)

    return this.presenter.toDetailView(chat, actorUserId, ctx)
  }

  /**
   * @param actorUserId - The viewer; results are scoped to chats they participate in.
   * @param query - Pagination and filter options.
   * @returns A page of the viewer's chats, newest activity first.
   */
  async listChats(actorUserId: string, query: ChatQueryDto) {
    const page = await this.chatsRepo.list(actorUserId, query)

    return { items: page.items.map((chat) => this.presenter.toSummaryView(chat, actorUserId)), meta: page.meta }
  }

  /**
   * Counts chats with unread activity for the viewer — a chat counts once no matter how many
   * unread messages it has. A chat that was cleared counts only if the last message arrived
   * after the clear, and only if it's newer than the viewer's last read timestamp.
   *
   * @param actorUserId - The viewer.
   * @returns The number of chats with unread activity.
   */
  async getUnreadCount(actorUserId: string) {
    const candidates = await this.chatsRepo.listUnreadCandidates(actorUserId)

    return candidates.filter((participant) => {
      const lastMessageAt = participant.chat.lastMessageAt
      if (!lastMessageAt) return false
      if (participant.clearedAt && lastMessageAt <= participant.clearedAt) return false
      return !participant.lastReadAt || lastMessageAt > participant.lastReadAt
    }).length
  }

  /**
   * Archives the chat for this participant only — the other participant's view is unaffected.
   *
   * @param actorUserId - The participant archiving the chat.
   * @param chatId - The chat to archive.
   * @throws {ChatNotFoundException} The chat doesn't exist, or the actor isn't a participant.
   */
  async archiveChat(actorUserId: string, chatId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    await this.chatsRepo.setArchived(chatId, actorUserId, new Date())
  }

  /**
   * @param actorUserId - The participant unarchiving the chat.
   * @param chatId - The chat to unarchive.
   * @throws {ChatNotFoundException} The chat doesn't exist, or the actor isn't a participant.
   */
  async unarchiveChat(actorUserId: string, chatId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    await this.chatsRepo.setArchived(chatId, actorUserId, null)
  }

  /**
   * Hides this participant's message history before now — a fresh cutoff, not a delete. Older
   * messages stop showing in their view of the chat, but stay intact for the other participant.
   *
   * @param actorUserId - The participant clearing the chat.
   * @param chatId - The chat to clear.
   * @throws {ChatNotFoundException} The chat doesn't exist, or the actor isn't a participant.
   */
  async clearChat(actorUserId: string, chatId: string) {
    const subject = await this.chatsRepo.getById(chatId)
    await this.chatPolicy.assertCanViewChat(subject, actorUserId)

    await this.chatsRepo.clear(chatId, actorUserId)
  }
}
