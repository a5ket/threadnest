import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { UserNestPreferencePolicy } from './user-nest-preference.policy'

describe('UserNestPreferencePolicy', () => {
  const membersRepo = createMockNestMemberRepository()
  const policy = new UserNestPreferencePolicy(membersRepo)

  const givenMembership = (isMember: boolean) =>
    membersRepo.exists.mockResolvedValue(isMember)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanManage', () => {
    it('allows when user is a member', async () => {
      givenMembership(true)

      await expect(
        policy.assertCanManage('user-1', 'nest-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when user is not a member', async () => {
      givenMembership(false)

      await expect(
        policy.assertCanManage('user-1', 'nest-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
