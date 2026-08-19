import { ChatAccess } from 'src/chat/chat.access'

export const createMockChatAccess = (): jest.Mocked<Pick<ChatAccess, 'getContext'>> => ({
  getContext: jest.fn(),
})
