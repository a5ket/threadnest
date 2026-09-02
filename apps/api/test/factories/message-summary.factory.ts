import { MessageSummary } from 'src/chat/message/types/message.summary'

export const createMessageSummary = (
  overrides: Partial<MessageSummary> = {},
): MessageSummary => ({
  id: 'message-1',
  chatId: 'chat-1',
  senderId: 'user-1',
  content: 'hello',
  replyToId: null,
  deletedAt: null,
  deletedById: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  sender: { id: 'user-1', profile: null },
  replyTo: null,
  ...overrides,
})
