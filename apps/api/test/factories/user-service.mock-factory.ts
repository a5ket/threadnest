import { UserService } from 'src/user/user.service'

export const createMockUserService = (): jest.Mocked<Pick<UserService, 'assertUserExists'>> => ({
  assertUserExists: jest.fn(),
})
