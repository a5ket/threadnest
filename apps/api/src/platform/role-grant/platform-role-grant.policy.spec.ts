import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createMockPlatformAccess } from 'test/factories/platform-access.mock-factory'
import { createPlatformAccessContext } from 'test/factories/platform-access-context.factory'
import { PlatformRoleGrantPolicy } from './platform-role-grant.policy'

describe('PlatformRoleGrantPolicy', () => {
  const platformAccess = createMockPlatformAccess()
  const policy = new PlatformRoleGrantPolicy(platformAccess as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertIsAdmin', () => {
    it('allows when the actor is an admin', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isAdmin: true }))

      await expect(policy.assertIsAdmin('actor-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when the actor is a moderator but not an admin', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true, isAdmin: false }))

      await expect(policy.assertIsAdmin('actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when the actor holds no platform role', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(policy.assertIsAdmin('actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
