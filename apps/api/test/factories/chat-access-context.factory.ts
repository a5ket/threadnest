import { ChatAccessContext } from 'src/chat/types/chat.access-context'

export const createChatAccessContext = (
  overrides: Partial<ChatAccessContext> = {},
): ChatAccessContext => ({
  isParticipant: true,
  canViewChat: true,
  canSendMessage: true,
  youBlockedThem: false,
  blockedByThem: false,
  ...overrides,
})
