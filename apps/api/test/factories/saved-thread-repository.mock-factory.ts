import { SavedThreadRepository } from 'src/thread/saved-thread.repository'

export const createMockSavedThreadRepository = (): jest.Mocked<Pick<SavedThreadRepository, 'upsert' | 'delete'>> => ({
  upsert: jest.fn(),
  delete: jest.fn(),
})
