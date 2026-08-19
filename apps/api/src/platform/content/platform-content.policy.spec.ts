import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createPlatformAccessContext } from 'test/factories/platform-access-context.factory'
import { createMockPlatformAccess } from 'test/factories/platform-access.mock-factory'
import { PlatformContentPolicy } from './platform-content.policy'

describe('PlatformContentPolicy', () => {
  const platformAccess = createMockPlatformAccess()
  const policy = new PlatformContentPolicy(platformAccess as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertIsModerator', () => {
    it('allows when the actor is a moderator', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))

      await expect(policy.assertIsModerator('actor-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when the actor holds no platform role', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(policy.assertIsModerator('actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
