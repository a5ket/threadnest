import { ChatPolicySubject } from 'src/chat/types/chat.policy-subject'

export const createChatPolicySubject = (
  overrides: Partial<ChatPolicySubject> = {},
): ChatPolicySubject => ({
  id: 'chat-1',
  isGroup: false,
  participants: [
    { userId: 'user-1', archivedAt: null, clearedAt: null },
    { userId: 'user-2', archivedAt: null, clearedAt: null },
  ],
  ...overrides,
})
