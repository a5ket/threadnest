import { PlatformActionLogService } from 'src/platform/action-log/platform-action-log.service'

export const createMockPlatformActionLogService = (): jest.Mocked<Pick<PlatformActionLogService, 'create'>> => ({
  create: jest.fn(),
})
