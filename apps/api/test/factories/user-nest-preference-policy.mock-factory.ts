import { UserNestPreferencePolicy } from 'src/nest/preferences/user-nest-preference.policy'

export const createMockUserNestPreferencePolicy = (): jest.Mocked<Pick<UserNestPreferencePolicy, 'assertCanManage'>> => ({
  assertCanManage: jest.fn(),
})
