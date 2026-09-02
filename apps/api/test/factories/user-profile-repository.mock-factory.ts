import { UserProfileRepository } from 'src/user/user-profile.repository'

export const createMockUserProfileRepository = (): jest.Mocked<Pick<UserProfileRepository, 'create' | 'isUsernameTaken' | 'getByUserId' | 'getByUsername' | 'update' | 'updateAvatarKey' | 'search' | 'getWithUser'>> => ({
  create: jest.fn(),
  isUsernameTaken: jest.fn(),
  getByUserId: jest.fn(),
  getByUsername: jest.fn(),
  update: jest.fn(),
  updateAvatarKey: jest.fn(),
  search: jest.fn(),
  getWithUser: jest.fn(),
})
