import { ThreadService } from 'src/thread/thread.service'

export const createMockThreadService = (): jest.Mocked<Pick<ThreadService, 'getByNestSlug' | 'getById' | 'removeByPlatform' | 'removeAllByAuthorPlatform' | 'adjustCommentCount' | 'updateLastCommentAt' | 'listByAuthor'>> => ({
  getByNestSlug: jest.fn(),
  getById: jest.fn(),
  removeByPlatform: jest.fn(),
  removeAllByAuthorPlatform: jest.fn(),
  adjustCommentCount: jest.fn(),
  updateLastCommentAt: jest.fn(),
  listByAuthor: jest.fn(),
})
