import { PlatformAccessContext } from 'src/platform/types/platform-access-context'

export const createPlatformAccessContext = (
  overrides: Partial<PlatformAccessContext> = {},
): PlatformAccessContext => ({
  level: 0,
  isModerator: false,
  isAdmin: false,
  ...overrides,
})
