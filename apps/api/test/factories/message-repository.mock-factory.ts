import { MessageRepository } from 'src/chat/message/message.repository'

export const createMockMessageRepository = (): jest.Mocked<Pick<MessageRepository, 'getById' | 'create' | 'list' | 'softDelete'>> => ({
  getById: jest.fn(),
  create: jest.fn(),
  list: jest.fn(),
  softDelete: jest.fn(),
})
