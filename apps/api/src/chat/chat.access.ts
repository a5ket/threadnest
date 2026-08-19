import { Injectable } from '@nestjs/common'
import { BlockService } from 'src/block/block.service'
import { ChatAccessContext } from './types/chat.access-context'
import { ChatPolicySubject } from './types/chat.policy-subject'

@Injectable()
export class ChatAccess {
  constructor(
    private readonly blocks: BlockService
  ) { }

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
