import { ThreadService } from 'src/thread/thread.service'

export const createMockThreadService = (): jest.Mocked<Pick<ThreadService, 'getByNestSlug' | 'getById' | 'removeByPlatform' | 'removeAllByAuthorPlatform'>> => ({
  getByNestSlug: jest.fn(),
  getById: jest.fn(),
  removeByPlatform: jest.fn(),
  removeAllByAuthorPlatform: jest.fn(),
})
