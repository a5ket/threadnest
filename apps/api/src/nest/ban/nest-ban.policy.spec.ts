import { NestMemberRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createMockNestBanRepository } from 'test/factories/nest-ban-repository.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createNestMember } from 'test/factories/nest-member.factory'
import { createMockUserService } from 'test/factories/user-service.mock-factory'
import { CannotBanYourselfException } from './exceptions/cannot-ban-yourself.exception'
import { CannotUnbanYourselfException } from './exceptions/cannot-unban-yourself.exception'
import { UserAlreadyBannedException } from './exceptions/user-already-banned.exception'
import { NestBanPolicy } from './nest-ban.policy'

describe('NestBanPolicy', () => {
  const nestAccess = createMockNestAccess()
  const membersRepo = createMockNestMemberRepository()
  const bansRepo = createMockNestBanRepository()
  const users = createMockUserService()
  const policy = new NestBanPolicy(nestAccess as any, membersRepo as any, bansRepo as any, users as any)

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  const givenTargetFound = (overrides: Parameters<typeof createNestMember>[0]) =>
    membersRepo.findByUser.mockResolvedValue(createNestMember(overrides))

  const givenTargetNotFound = () =>
    membersRepo.findByUser.mockResolvedValue(null)

  const givenBanned = () =>
    bansRepo.existsActive.mockResolvedValue(true)

  const givenNotBanned = () =>
    bansRepo.existsActive.mockResolvedValue(false)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanBanUser', () => {
    it('allows moderator to ban a lower role member', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: true })
      givenNotBanned()
      givenTargetFound({ role: NestMemberRole.MEMBER })

      await expect(
        policy.assertCanBanUser('nest-1', 'actor-1', 'target-1'),
      ).resolves.toBeUndefined()
    })

    it('allows banning a non-member target', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: true })
      givenNotBanned()
      givenTargetNotFound()

      await expect(
        policy.assertCanBanUser('nest-1', 'actor-1', 'target-1'),
      ).resolves.toBeUndefined()
    })

    it('throws CannotBanYourselfException when actor equals target', async () => {
      await expect(
        policy.assertCanBanUser('nest-1', 'user-1', 'user-1'),
      ).rejects.toThrow(CannotBanYourselfException)
    })

    it('throws InsufficientPermissionsException when canManageBans is false', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: false })

      await expect(
        policy.assertCanBanUser('nest-1', 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when actor has no role', async () => {
      givenContext({ role: null, canManageBans: true })

      await expect(
        policy.assertCanBanUser('nest-1', 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws UserAlreadyBannedException when target is already banned', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: true })
      givenBanned()

      await expect(
        policy.assertCanBanUser('nest-1', 'actor-1', 'target-1'),
      ).rejects.toThrow(UserAlreadyBannedException)
    })

    it('throws InsufficientPermissionsException when actor role is not higher than target', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: true })
      givenNotBanned()
      givenTargetFound({ role: NestMemberRole.MODERATOR })

      await expect(
        policy.assertCanBanUser('nest-1', 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanUnbanUser', () => {
    it('allows when actor can manage bans', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: true })

      await expect(
        policy.assertCanUnbanUser('nest-1', 'actor-1', 'target-1'),
      ).resolves.toBeUndefined()
    })

    it('throws CannotUnbanYourselfException when actor equals target', async () => {
      await expect(
        policy.assertCanUnbanUser('nest-1', 'user-1', 'user-1'),
      ).rejects.toThrow(CannotUnbanYourselfException)
    })

    it('throws InsufficientPermissionsException when canManageBans is false', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: false })

      await expect(
        policy.assertCanUnbanUser('nest-1', 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when actor has no role', async () => {
      givenContext({ role: null, canManageBans: true })

      await expect(
        policy.assertCanUnbanUser('nest-1', 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanViewBans', () => {
    it('allows when actor can manage bans', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: true })

      await expect(
        policy.assertCanViewBans('nest-1', 'actor-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canManageBans is false', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageBans: false })

      await expect(
        policy.assertCanViewBans('nest-1', 'actor-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when actor has no role', async () => {
      givenContext({ role: null, canManageBans: true })

      await expect(
        policy.assertCanViewBans('nest-1', 'actor-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
