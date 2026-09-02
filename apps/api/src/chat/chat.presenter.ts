import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { ChatAccessContext } from './types/chat.access-context'
import { ChatSummaryRaw } from './types/chat.summary'

/** Shapes chat rows into viewer-scoped API responses. */
@Injectable()
export class ChatPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  /**
   * Applies two viewer-specific rules before exposing the last message: it's hidden entirely if
   * the viewer cleared the chat after it was sent, and its content is nulled out (but the row
   * still shown) if it was deleted.
   *
   * @param chat - The chat row, with participants and the latest message preloaded.
   * @param viewerId - The user viewing this chat, used to resolve "the other participant" and
   * apply their clear/read state.
   * @returns A summary view for chat lists: the other participant, the visible last message
   * (if any), an unread flag, and this viewer's archive state.
   */
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

  /**
   * @param chat - The chat row, with participants and the latest message preloaded.
   * @param viewerId - The user viewing this chat.
   * @param ctx - The precomputed access context from {@link ChatPolicy.assertCanViewChat}, so
   * this doesn't need to recompute block/participation state.
   * @returns The summary view plus the access context and the other participant's read state,
   * for a single-chat detail screen.
   */
  toDetailView(chat: ChatSummaryRaw, viewerId: string, ctx: ChatAccessContext) {
    const other = chat.participants.find((p) => p.userId !== viewerId)

    return {
      ...this.toSummaryView(chat, viewerId),
      access: ctx,
      otherParticipantLastReadAt: other?.lastReadAt ?? null,
    }
  }
}
