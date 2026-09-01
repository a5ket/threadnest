import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { NestPayoutPolicy } from './nest-payout.policy'

describe('NestPayoutPolicy', () => {
  const nestAccess = createMockNestAccess()
  const policy = new NestPayoutPolicy(nestAccess as any)

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanManage', () => {
    it('allows the owner', async () => {
      givenContext({ isOwner: true })

      await expect(
        policy.assertCanManage('nest-1', 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException for a non-owner', async () => {
      givenContext({ isOwner: false })

      await expect(
        policy.assertCanManage('nest-1', 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
