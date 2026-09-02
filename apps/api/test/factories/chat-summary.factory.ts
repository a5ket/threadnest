import { ChatSummaryRaw } from 'src/chat/types/chat.summary'

export const createChatSummary = (
  overrides: Partial<ChatSummaryRaw> = {},
): ChatSummaryRaw => ({
  id: 'chat-1',
  isGroup: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  lastMessageAt: null,
  participants: [
    { userId: 'user-1', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-1', profile: { username: 'happy_otter1234', displayName: null, avatarKey: null } } },
    { userId: 'user-2', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-2', profile: { username: 'lucky_fox5678', displayName: null, avatarKey: null } } },
  ],
  messages: [],
  ...overrides,
})
