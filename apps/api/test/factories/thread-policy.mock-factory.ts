import { ThreadPolicy } from 'src/thread/thread.policy'

export const createMockThreadPolicy = (): jest.Mocked<Pick<ThreadPolicy, 'assertCanCreateThread' | 'assertCanReadThreadContext' | 'assertCanReadThread' | 'assertCanReadThreads' | 'assertCanUpdateThread' | 'assertCanDeleteThread' | 'assertCanManageThreadLock' | 'assertCanManageThreadPin' | 'assertCanVoteThread' | 'assertCanSaveThread'>> => ({
  assertCanCreateThread: jest.fn(),
  assertCanReadThreadContext: jest.fn(),
  assertCanReadThread: jest.fn(),
  assertCanReadThreads: jest.fn(),
  assertCanUpdateThread: jest.fn(),
  assertCanDeleteThread: jest.fn(),
  assertCanManageThreadLock: jest.fn(),
  assertCanManageThreadPin: jest.fn(),
  assertCanVoteThread: jest.fn(),
  assertCanSaveThread: jest.fn(),
})
