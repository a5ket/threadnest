import { UserSuspensionRepository } from 'src/user/suspension/user-suspension.repository'

export const createMockUserSuspensionRepository = (): jest.Mocked<Pick<UserSuspensionRepository, 'create' | 'revoke' | 'getActive'>> => ({
  create: jest.fn(),
  revoke: jest.fn(),
  getActive: jest.fn(),
})
