import { ThreadAccess } from 'src/thread/thread.access'

export const createMockThreadAccess = (): jest.Mocked<Pick<ThreadAccess, 'getContext'>> => ({
  getContext: jest.fn(),
})
