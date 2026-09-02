import { ThreadVoteRepository } from 'src/thread/thread-vote.repository'

export const createMockThreadVoteRepository = (): jest.Mocked<Pick<ThreadVoteRepository, 'find' | 'upsert' | 'delete'>> => ({
  find: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
})
