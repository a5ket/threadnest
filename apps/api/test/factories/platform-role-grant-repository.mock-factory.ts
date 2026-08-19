import { PlatformRoleGrantRepository } from 'src/platform/role-grant/platform-role-grant.repository'

export const createMockPlatformRoleGrantRepository = (): jest.Mocked<Pick<PlatformRoleGrantRepository, 'create' | 'createWithoutActor' | 'revoke' | 'getActiveRole'>> => ({
  create: jest.fn(),
  createWithoutActor: jest.fn(),
  revoke: jest.fn(),
  getActiveRole: jest.fn(),
})
