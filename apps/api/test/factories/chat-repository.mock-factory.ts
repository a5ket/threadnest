import { ChatRepository } from 'src/chat/chat.repository'

export const createMockChatRepository = (): jest.Mocked<Pick<ChatRepository, 'getById' | 'getSummaryById' | 'findDirect' | 'createDirect' | 'list' | 'touchLastMessageAt' | 'listUnreadCandidates' | 'setArchived' | 'clear' | 'markRead'>> => ({
  getById: jest.fn(),
  getSummaryById: jest.fn(),
  findDirect: jest.fn(),
  createDirect: jest.fn(),
  list: jest.fn(),
  touchLastMessageAt: jest.fn(),
  listUnreadCandidates: jest.fn(),
  setArchived: jest.fn(),
  clear: jest.fn(),
  markRead: jest.fn(),
})
