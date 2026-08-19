import { PlatformUserSuspensionPolicy } from 'src/platform/suspension/platform-user-suspension.policy'

export const createMockPlatformUserSuspensionPolicy = (): jest.Mocked<Pick<PlatformUserSuspensionPolicy, 'assertIsModerator'>> => ({
  assertIsModerator: jest.fn(),
})
