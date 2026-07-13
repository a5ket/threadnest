import { NestMemberRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createNestMember } from 'test/factories/nest-member.factory'
import { createNestPolicySubject } from 'test/factories/nest-policy-subject.factory'
import { CannotTransferOwnershipToSelfException } from './exceptions/cannot-transfer-ownership-to-self.exception'
import { NestLimitReachedException } from './exceptions/nest-limit-reached.exception'
import { TargetUserNotMemberException } from './exceptions/target-user-not-member.exception'
import { NestPolicy } from './nest.policy'

describe('NestPolicy', () => {
  const nestAccess = createMockNestAccess()
  const memberRepo = createMockNestMemberRepository()
  const policy = new NestPolicy(nestAccess as any, memberRepo as any)

  const nest = createNestPolicySubject()

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  const givenOwnerCount = (count: number) =>
    memberRepo.countByRole.mockResolvedValue(count)

  const givenTargetFound = (overrides: Parameters<typeof createNestMember>[0]) =>
    memberRepo.findByUser.mockResolvedValue(createNestMember(overrides))

  const givenTargetNotFound = () =>
    memberRepo.findByUser.mockResolvedValue(null)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanCreateNest', () => {
    it('allows creation when owner count is below limit', async () => {
      givenOwnerCount(99)

      await expect(
        policy.assertCanCreateNest('user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws NestLimitReachedException when owner count reaches limit', async () => {
      givenOwnerCount(100)

      await expect(
        policy.assertCanCreateNest('user-1'),
      ).rejects.toThrow(NestLimitReachedException)
    })
  })

  describe('assertCanViewNestByAccessContext', () => {
    it('allows when canViewNest is true', async () => {
      await expect(
        policy.assertCanViewNestByAccessContext(createNestAccessContext({ canViewNest: true })),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canViewNest is false', async () => {
      await expect(
        policy.assertCanViewNestByAccessContext(createNestAccessContext({ canViewNest: false })),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanUpdateNest', () => {
    it('allows when canEditNest is true', async () => {
      givenContext({ canEditNest: true })

      await expect(
        policy.assertCanUpdateNest(nest, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canEditNest is false', async () => {
      givenContext({ canEditNest: false })

      await expect(
        policy.assertCanUpdateNest(nest, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanDeleteNest', () => {
    it('allows when canDeleteNest is true', async () => {
      givenContext({ canDeleteNest: true })

      await expect(
        policy.assertCanDeleteNest(nest, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canDeleteNest is false', async () => {
      givenContext({ canDeleteNest: false })

      await expect(
        policy.assertCanDeleteNest(nest, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanTransferOwnership', () => {
    it('allows owner to transfer ownership to a member', async () => {
      givenContext({ role: NestMemberRole.OWNER, isOwner: true })
      givenTargetFound({ role: NestMemberRole.MEMBER })

      await expect(
        policy.assertCanTransferOwnership(nest, 'owner-1', 'target-1'),
      ).resolves.toBeUndefined()
    })

    it('throws CannotTransferOwnershipToSelfException when actor equals target', async () => {
      await expect(
        policy.assertCanTransferOwnership(nest, 'user-1', 'user-1'),
      ).rejects.toThrow(CannotTransferOwnershipToSelfException)
    })

    it('throws InsufficientPermissionsException when actor is not owner', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, isOwner: false })

      await expect(
        policy.assertCanTransferOwnership(nest, 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws TargetUserNotMemberException when target is not a member', async () => {
      givenContext({ role: NestMemberRole.OWNER, isOwner: true })
      givenTargetNotFound()

      await expect(
        policy.assertCanTransferOwnership(nest, 'owner-1', 'target-1'),
      ).rejects.toThrow(TargetUserNotMemberException)
    })
  })
})
