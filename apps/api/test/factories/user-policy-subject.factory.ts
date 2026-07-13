import { UserPolicySubject } from 'src/user/types/user.policy-subject'

export const createUserPolicySubject = (
  overrides: Partial<UserPolicySubject> = {},
): UserPolicySubject => ({
  userId: 'user-1',
  isPublic: true,
  ...overrides,
})
