import { ThreadPolicy } from 'src/thread/thread.policy'

export const createMockThreadPolicy = (): jest.Mocked<Pick<ThreadPolicy, 'assertCanReadThread'>> => ({
  assertCanReadThread: jest.fn(),
})
