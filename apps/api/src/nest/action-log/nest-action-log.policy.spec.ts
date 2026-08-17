import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { NestActionLogPolicy } from './nest-action-log.policy'

describe('NestActionLogPolicy', () => {
  const nestAccess = createMockNestAccess()
  const policy = new NestActionLogPolicy(nestAccess as any)

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanViewActionLog', () => {
    it('allows when canViewActionLog is true', async () => {
      givenContext({ canViewActionLog: true })

      await expect(
        policy.assertCanViewActionLog('nest-1', 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canViewActionLog is false', async () => {
      givenContext({ canViewActionLog: false })

      await expect(
        policy.assertCanViewActionLog('nest-1', 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
