import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { ChatAccessContext } from './types/chat.access-context'
import { ChatSummaryRaw } from './types/chat.summary'

@Injectable()
export class ChatPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  toSummaryView(chat: ChatSummaryRaw, viewerId: string) {
    const me = chat.participants.find((p) => p.userId === viewerId)
    const other = chat.participants.find((p) => p.userId !== viewerId)
    const lastMessage = chat.messages[0]
    const visibleLastMessage = lastMessage && (!me?.clearedAt || lastMessage.createdAt > me.clearedAt) ? lastMessage : null

    return {
      id: chat.id,
      otherParticipant: other?.user ? this.userPresenter.toReferenceView(other.user) : null,
      lastMessage: visibleLastMessage
        ? {
            id: visibleLastMessage.id,
            content: visibleLastMessage.deletedAt ? null : visibleLastMessage.content,
            senderId: visibleLastMessage.senderId,
            createdAt: visibleLastMessage.createdAt,
            deletedAt: visibleLastMessage.deletedAt,
          }
        : null,
      hasUnread: Boolean(visibleLastMessage && (!me?.lastReadAt || visibleLastMessage.createdAt > me.lastReadAt)),
      archivedAt: me?.archivedAt ?? null,
      createdAt: chat.createdAt,
    }
  }

  toDetailView(chat: ChatSummaryRaw, viewerId: string, ctx: ChatAccessContext) {
    const other = chat.participants.find((p) => p.userId !== viewerId)

    return {
      ...this.toSummaryView(chat, viewerId),
      access: ctx,
      otherParticipantLastReadAt: other?.lastReadAt ?? null,
    }
  }
}
