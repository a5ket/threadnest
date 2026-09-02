import { Injectable } from '@nestjs/common'
import { BlockService } from 'src/block/block.service'
import { ChatAccessContext } from './types/chat.access-context'
import { ChatPolicySubject } from './types/chat.policy-subject'

/** Computes what a viewer can do with a chat — for a 1:1 chat, whether either side has blocked the other. */
@Injectable()
export class ChatAccess {
  constructor(
    private readonly blocks: BlockService
  ) { }

  /**
   * Group chats skip the block check entirely (blocking is a 1:1 concept here — there's no
   * per-participant mute in a group). For a 1:1 chat, sending is disabled if either side has
   * blocked the other, but the chat itself stays viewable either way.
   *
   * @param chat - The chat to compute access for.
   * @param actorUserId - The viewer.
   * @returns Participation status plus the block relationship, for a 1:1 chat.
   */
  async getContext(chat: ChatPolicySubject, actorUserId: string): Promise<ChatAccessContext> {
    const participant = chat.participants.find((p) => p.userId === actorUserId)

    if (!participant) {
      return { isParticipant: false, canViewChat: false, canSendMessage: false, youBlockedThem: false, blockedByThem: false }
    }

    if (chat.isGroup) {
      return { isParticipant: true, canViewChat: true, canSendMessage: true, youBlockedThem: false, blockedByThem: false }
    }

    const otherUserId = chat.participants.find((p) => p.userId !== actorUserId)?.userId

    const [youBlockedThem, blockedByThem] = otherUserId
      ? await Promise.all([
          this.blocks.exists(actorUserId, otherUserId),
          this.blocks.exists(otherUserId, actorUserId),
        ])
      : [false, false]

    return {
      isParticipant: true,
      canViewChat: true,
      canSendMessage: !youBlockedThem && !blockedByThem,
      youBlockedThem,
      blockedByThem,
    }
  }
}
