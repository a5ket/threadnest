import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createMockPlatformAccess } from 'test/factories/platform-access.mock-factory'
import { createPlatformAccessContext } from 'test/factories/platform-access-context.factory'
import { PlatformUserSuspensionPolicy } from './platform-user-suspension.policy'

describe('PlatformUserSuspensionPolicy', () => {
  const platformAccess = createMockPlatformAccess()
  const policy = new PlatformUserSuspensionPolicy(platformAccess as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertIsModerator', () => {
    it('allows when the actor is a moderator', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))

      await expect(policy.assertIsModerator('actor-1')).resolves.toBeUndefined()
    })

    it('allows when the actor is an admin', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true, isAdmin: true }))

      await expect(policy.assertIsModerator('actor-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when the actor holds no platform role', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(policy.assertIsModerator('actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
