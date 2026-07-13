import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createUserPolicySubject } from 'test/factories/user-policy-subject.factory'
import { UserPolicy } from './user.policy'

describe('UserPolicy', () => {
  const policy = new UserPolicy()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanReadUserProfile', () => {
    it('allows reading a public profile', async () => {
      await expect(
        policy.assertCanReadUserProfile(createUserPolicySubject({ isPublic: true })),
      ).resolves.toBeUndefined()
    })

    it('allows reading own private profile', async () => {
      await expect(
        policy.assertCanReadUserProfile(
          createUserPolicySubject({ userId: 'user-1', isPublic: false }),
          'user-1',
        ),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when profile is private and actor is a different user', () => {
      expect(() =>
        policy.assertCanReadUserProfile(
          createUserPolicySubject({ userId: 'user-1', isPublic: false }),
          'user-2',
        ),
      ).toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when profile is private and no actor is provided', () => {
      expect(() =>
        policy.assertCanReadUserProfile(
          createUserPolicySubject({ userId: 'user-1', isPublic: false }),
        ),
      ).toThrow(InsufficientPermissionsException)
    })
  })
})
