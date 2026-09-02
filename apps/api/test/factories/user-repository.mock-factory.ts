import { UserRepository } from 'src/user/user.repository'

export const createMockUserRepository = (): jest.Mocked<Pick<UserRepository, 'exists' | 'findByIdWithEmail' | 'existsByEmail' | 'findByEmailWithCredentials' | 'getByIdWithCredentials' | 'getByEmail' | 'updatePassword' | 'markEmailVerified' | 'updateEmail' | 'create'>> => ({
  exists: jest.fn(),
  findByIdWithEmail: jest.fn(),
  existsByEmail: jest.fn(),
  findByEmailWithCredentials: jest.fn(),
  getByIdWithCredentials: jest.fn(),
  getByEmail: jest.fn(),
  updatePassword: jest.fn(),
  markEmailVerified: jest.fn(),
  updateEmail: jest.fn(),
  create: jest.fn(),
})
