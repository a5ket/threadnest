import { createMockNestMemberService } from 'test/factories/nest-member-service.mock-factory'
import { createPlatformAccessContext } from 'test/factories/platform-access-context.factory'
import { createMockPlatformAccess } from 'test/factories/platform-access.mock-factory'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createMockUserService } from 'test/factories/user-service.mock-factory'
import { InvalidAccessTokenException } from 'src/auth/exceptions/invalid-access-token.exception'
import { UserNotFoundException } from 'src/user/exceptions/user-not-found.exception'
import { MeService } from './me.service'

describe('MeService', () => {
  const user = createMockUserService()
  const nestMember = createMockNestMemberService()
  const platformAccess = createMockPlatformAccess()
  const storage = createMockStorageService()

  const service = new MeService(user as any, nestMember as any, platformAccess as any, storage as any)

  const profileWithUser = (overrides: Record<string, unknown> = {}) => ({
    username: 'happy_otter1234',
    avatarKey: null,
    user: { id: 'user-1', email: 'user@example.com', emailVerifiedAt: null },
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    nestMember.listMembershipReferencesByUser.mockResolvedValue([])
    platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())
  })

  describe('getBootstrapData', () => {
    it('assembles the user, avatar URL, and nest memberships', async () => {
      user.getProfileWithUser.mockResolvedValue(profileWithUser({ avatarKey: 'avatars/user-1/a.webp' }))
      nestMember.listMembershipReferencesByUser.mockResolvedValue([{ id: 'nest-1' }] as any)

      const result = await service.getBootstrapData('user-1')

      expect(result.user).toMatchObject({
        id: 'user-1',
        email: 'user@example.com',
        username: 'happy_otter1234',
        avatarUrl: 'https://cdn.test/avatars/user-1/a.webp',
      })
      expect(result.nests).toEqual([{ id: 'nest-1' }])
    })

    it('returns a null avatar URL when the profile has no avatar', async () => {
      user.getProfileWithUser.mockResolvedValue(profileWithUser({ avatarKey: null }))

      const result = await service.getBootstrapData('user-1')

      expect(result.user.avatarUrl).toBeNull()
    })

    it('reports emailVerified as false when emailVerifiedAt is null', async () => {
      user.getProfileWithUser.mockResolvedValue(profileWithUser({ user: { id: 'user-1', email: 'user@example.com', emailVerifiedAt: null } }))

      const result = await service.getBootstrapData('user-1')

      expect(result.user.emailVerified).toBe(false)
    })

    it('reports emailVerified as true when emailVerifiedAt is set', async () => {
      user.getProfileWithUser.mockResolvedValue(profileWithUser({ user: { id: 'user-1', email: 'user@example.com', emailVerifiedAt: new Date() } }))

      const result = await service.getBootstrapData('user-1')

      expect(result.user.emailVerified).toBe(true)
    })

    it('includes the resolved platform access context', async () => {
      user.getProfileWithUser.mockResolvedValue(profileWithUser())
      const ctx = createPlatformAccessContext({ isAdmin: true, level: 100 })
      platformAccess.getContext.mockResolvedValue(ctx)

      const result = await service.getBootstrapData('user-1')

      expect(result.user.platformAccess).toBe(ctx)
    })

    it('translates a deleted-user lookup failure into an invalid-access-token error, not a 404', async () => {
      user.getProfileWithUser.mockRejectedValue(new UserNotFoundException())

      await expect(service.getBootstrapData('user-1')).rejects.toThrow(InvalidAccessTokenException)
    })

    it('propagates any other failure unchanged', async () => {
      user.getProfileWithUser.mockRejectedValue(new Error('database unavailable'))

      await expect(service.getBootstrapData('user-1')).rejects.toThrow('database unavailable')
    })
  })
})
