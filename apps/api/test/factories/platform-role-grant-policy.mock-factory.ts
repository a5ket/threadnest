import { PlatformRoleGrantPolicy } from 'src/platform/role-grant/platform-role-grant.policy'

export const createMockPlatformRoleGrantPolicy = (): jest.Mocked<Pick<PlatformRoleGrantPolicy, 'assertIsAdmin'>> => ({
  assertIsAdmin: jest.fn(),
})
