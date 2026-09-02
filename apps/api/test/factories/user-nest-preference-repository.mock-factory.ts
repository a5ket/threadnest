import { UserNestPreferenceRepository } from 'src/nest/preferences/user-nest-preference.repository'

export const createMockUserNestPreferenceRepository = (): jest.Mocked<Pick<UserNestPreferenceRepository, 'allowsInvites' | 'getByUserAndNest' | 'upsert'>> => ({
  allowsInvites: jest.fn(),
  getByUserAndNest: jest.fn(),
  upsert: jest.fn(),
})
