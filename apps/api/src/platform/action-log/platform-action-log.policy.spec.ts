import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createPlatformAccessContext } from 'test/factories/platform-access-context.factory'
import { createMockPlatformAccess } from 'test/factories/platform-access.mock-factory'
import { PlatformActionLogPolicy } from './platform-action-log.policy'

describe('PlatformActionLogPolicy', () => {
  const platformAccess = createMockPlatformAccess()
  const policy = new PlatformActionLogPolicy(platformAccess as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanViewActionLog', () => {
    it('allows when the actor is a moderator', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))

      await expect(policy.assertCanViewActionLog('actor-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when the actor holds no platform role', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(policy.assertCanViewActionLog('actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
