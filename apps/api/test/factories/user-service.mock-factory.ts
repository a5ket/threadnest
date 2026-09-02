import { UserService } from 'src/user/user.service'

export const createMockUserService = (): jest.Mocked<Pick<UserService, 'assertUserExists' | 'getByEmail' | 'existsByEmail' | 'create' | 'findByEmailWithCredentials' | 'getByIdWithCredentials' | 'updatePassword' | 'findByIdWithEmail' | 'markEmailVerified' | 'updateEmail' | 'getProfileWithUser'>> => ({
  assertUserExists: jest.fn(),
  getByEmail: jest.fn(),
  existsByEmail: jest.fn(),
  create: jest.fn(),
  findByEmailWithCredentials: jest.fn(),
  getByIdWithCredentials: jest.fn(),
  updatePassword: jest.fn(),
  findByIdWithEmail: jest.fn(),
  markEmailVerified: jest.fn(),
  updateEmail: jest.fn(),
  getProfileWithUser: jest.fn(),
})
