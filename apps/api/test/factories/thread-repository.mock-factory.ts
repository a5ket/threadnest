import { ThreadRepository } from 'src/thread/thread.repository'

export const createMockThreadRepository = (): jest.Mocked<Pick<ThreadRepository, 'getById'>> => ({
  getById: jest.fn(),
})
