import { UserSuspensionService } from 'src/user/suspension/user-suspension.service'

export const createMockUserSuspensionService = (): jest.Mocked<Pick<UserSuspensionService, 'suspend' | 'unsuspend' | 'getActive'>> => ({
  suspend: jest.fn(),
  unsuspend: jest.fn(),
  getActive: jest.fn(),
})
