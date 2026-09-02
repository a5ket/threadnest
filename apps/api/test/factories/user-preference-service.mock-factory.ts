import { UserPreferenceService } from 'src/user/preferences/user-preference.service'

export const createMockUserPreferenceService = (): jest.Mocked<Pick<UserPreferenceService, 'get' | 'update'>> => ({
  get: jest.fn(),
  update: jest.fn(),
})
