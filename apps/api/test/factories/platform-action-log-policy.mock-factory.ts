import { PlatformActionLogPolicy } from 'src/platform/action-log/platform-action-log.policy'

export const createMockPlatformActionLogPolicy = (): jest.Mocked<Pick<PlatformActionLogPolicy, 'assertCanViewActionLog'>> => ({
  assertCanViewActionLog: jest.fn(),
})
