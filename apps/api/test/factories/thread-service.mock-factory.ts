import { ThreadService } from 'src/thread/thread.service'

export const createMockThreadService = (): jest.Mocked<Pick<ThreadService, 'getByNestSlug' | 'getById'>> => ({
  getByNestSlug: jest.fn(),
  getById: jest.fn(),
})
