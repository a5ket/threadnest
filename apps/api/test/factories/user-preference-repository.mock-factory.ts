import { UserPreferenceRepository } from 'src/user/preferences/user-preference.repository'

export const createMockUserPreferenceRepository = (): jest.Mocked<Pick<UserPreferenceRepository, 'getByUserId' | 'upsert'>> => ({
  getByUserId: jest.fn(),
  upsert: jest.fn(),
})
