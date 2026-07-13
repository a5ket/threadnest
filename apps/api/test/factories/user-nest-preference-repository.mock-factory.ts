import { UserNestPreferenceRepository } from 'src/nest/preferences/user-nest-preference.repository'

export const createMockUserNestPreferenceRepository = (): jest.Mocked<Pick<UserNestPreferenceRepository, 'allowsInvites'>> => ({
  allowsInvites: jest.fn(),
})
