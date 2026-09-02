import { ChatPolicy } from 'src/chat/chat.policy'

export const createMockChatPolicy = (): jest.Mocked<Pick<ChatPolicy, 'assertCanViewChat' | 'assertCanSendMessage'>> => ({
  assertCanViewChat: jest.fn(),
  assertCanSendMessage: jest.fn(),
})
