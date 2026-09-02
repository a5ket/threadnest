import { Injectable } from '@nestjs/common'
import { ChatAccess } from './chat.access'
import { ChatNotFoundException } from './exceptions/chat-not-found.exception'
import { CannotMessageBlockedUserException } from './exceptions/cannot-message-blocked-user.exception'
import { ChatPolicySubject } from './types/chat.policy-subject'

@Injectable()
export class ChatPolicy {
  constructor(
    private readonly chatAccess: ChatAccess
  ) { }

  /**
   * @returns The computed context, so callers who need it afterward (like a presenter) don't have to fetch it twice.
   * @throws {ChatNotFoundException} Not a participant in this chat.
   */
  async assertCanViewChat(chat: ChatPolicySubject, actorUserId: string) {
    const ctx = await this.chatAccess.getContext(chat, actorUserId)

    if (!ctx.canViewChat) {
      throw new ChatNotFoundException()
    }

    return ctx
  }

  /**
   * @throws {ChatNotFoundException} Not a participant in this chat.
   * @throws {CannotMessageBlockedUserException} Either side has blocked the other.
   */
  async assertCanSendMessage(chat: ChatPolicySubject, actorUserId: string) {
    const ctx = await this.assertCanViewChat(chat, actorUserId)

    if (!ctx.canSendMessage) {
      throw new CannotMessageBlockedUserException()
    }

    return ctx
  }
}
