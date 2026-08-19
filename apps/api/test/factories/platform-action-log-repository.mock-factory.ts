import { PlatformActionLogRepository } from 'src/platform/action-log/platform-action-log.repository'

export const createMockPlatformActionLogRepository = (): jest.Mocked<Pick<PlatformActionLogRepository,
  'create' | 'list'
>> => ({
  create: jest.fn(),
  list: jest.fn(),
})
