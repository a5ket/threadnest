import { NestInviteStatus } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createMockNestBanRepository } from 'test/factories/nest-ban-repository.mock-factory'
import { createMockNestInviteRepository } from 'test/factories/nest-invite-repository.mock-factory'
import { createMockNestJoinRequestRepository } from 'test/factories/nest-join-request-repository.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createNestInvitePolicySubject } from 'test/factories/nest-invite-policy-subject.factory'
import { createNestPolicySubject } from 'test/factories/nest-policy-subject.factory'
import { createMockUserNestPreferenceRepository } from 'test/factories/user-nest-preference-repository.mock-factory'
import { AlreadyHasPendingJoinRequestException } from '../join-request/exceptions/already-has-pending-join-request.exception'
import { AlreadyMemberException } from '../member/exceptions/already-member.exception'
import { UserIsBannedException } from '../member/exceptions/user-is-banned.exception'
import { AlreadyInvitedException } from './exceptions/already-invited.exception'
import { InviteNotPendingException } from './exceptions/invite-not-pending.exception'
import { InvitesNotAllowedException } from './exceptions/invites-not-allowed.exception'
import { NestInviteNotFoundException } from './exceptions/nest-invite-not-found.exception'
import { NestInvitePolicy } from './nest-invite.policy'

describe('NestInvitePolicy', () => {
  const nestAccess = createMockNestAccess()
  const memberRepo = createMockNestMemberRepository()
  const banRepo = createMockNestBanRepository()
  const inviteRepo = createMockNestInviteRepository()
  const requestRepo = createMockNestJoinRequestRepository()
  const preferences = createMockUserNestPreferenceRepository()

  const policy = new NestInvitePolicy(
    nestAccess as any,
    memberRepo as any,
    banRepo as any,
    inviteRepo as any,
    requestRepo as any,
    preferences as any,
  )

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanCreate', () => {
    const nest = createNestPolicySubject()

    const givenCanCreateDefaults = () => {
      givenContext({ canManageInvites: true })
      requestRepo.existsPending.mockResolvedValue(false)
      inviteRepo.existsPending.mockResolvedValue(false)
      memberRepo.exists.mockResolvedValue(false)
      banRepo.existsActive.mockResolvedValue(false)
      preferences.allowsInvites.mockResolvedValue(true)
    }

    it('allows when all conditions are met', async () => {
      givenCanCreateDefaults()

      await expect(policy.assertCanCreate(nest, 'actor-1', 'target-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canManageInvites is false', async () => {
      givenContext({ canManageInvites: false })

      await expect(policy.assertCanCreate(nest, 'actor-1', 'target-1')).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws UserIsBannedException when target has an active ban', async () => {
      givenCanCreateDefaults()
      banRepo.existsActive.mockResolvedValue(true)

      await expect(policy.assertCanCreate(nest, 'actor-1', 'target-1')).rejects.toThrow(UserIsBannedException)
    })

    it('throws AlreadyMemberException when target is already a member', async () => {
      givenCanCreateDefaults()
      memberRepo.exists.mockResolvedValue(true)

      await expect(policy.assertCanCreate(nest, 'actor-1', 'target-1')).rejects.toThrow(AlreadyMemberException)
    })

    it('throws AlreadyInvitedException when target already has a pending invite', async () => {
      givenCanCreateDefaults()
      inviteRepo.existsPending.mockResolvedValue(true)

      await expect(policy.assertCanCreate(nest, 'actor-1', 'target-1')).rejects.toThrow(AlreadyInvitedException)
    })

    it('throws AlreadyHasPendingJoinRequestException when target already has a pending join request', async () => {
      givenCanCreateDefaults()
      requestRepo.existsPending.mockResolvedValue(true)

      await expect(policy.assertCanCreate(nest, 'actor-1', 'target-1')).rejects.toThrow(AlreadyHasPendingJoinRequestException)
    })

    it('throws InvitesNotAllowedException when target does not allow invites', async () => {
      givenCanCreateDefaults()
      preferences.allowsInvites.mockResolvedValue(false)

      await expect(policy.assertCanCreate(nest, 'actor-1', 'target-1')).rejects.toThrow(InvitesNotAllowedException)
    })
  })

  describe('assertCanListAsNest', () => {
    const nest = createNestPolicySubject()

    it('allows when actor can manage invites', async () => {
      givenContext({ canManageInvites: true })

      await expect(policy.assertCanListAsNest(nest, 'actor-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canManageInvites is false', async () => {
      givenContext({ canManageInvites: false })

      await expect(policy.assertCanListAsNest(nest, 'actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanGetAsNest', () => {
    const invite = createNestInvitePolicySubject()

    it('allows when actor can manage invites', async () => {
      givenContext({ canManageInvites: true })

      await expect(policy.assertCanGetAsNest(invite, 'actor-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canManageInvites is false', async () => {
      givenContext({ canManageInvites: false })

      await expect(policy.assertCanGetAsNest(invite, 'actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanGetAsUser', () => {
    it('allows when invite belongs to actor', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1' })

      await expect(policy.assertCanGetAsUser(invite, 'user-1')).resolves.toBeUndefined()
    })

    it('throws NestInviteNotFoundException when invite belongs to a different user', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1' })

      await expect(policy.assertCanGetAsUser(invite, 'other-user')).rejects.toThrow(NestInviteNotFoundException)
    })
  })

  describe('assertCanAccept', () => {
    it('allows when all conditions are met', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1', status: NestInviteStatus.PENDING })
      memberRepo.exists.mockResolvedValue(false)
      banRepo.existsActive.mockResolvedValue(false)

      await expect(policy.assertCanAccept(invite, 'user-1')).resolves.toBeUndefined()
    })

    it('throws NestInviteNotFoundException when invite belongs to a different user', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1' })

      await expect(policy.assertCanAccept(invite, 'other-user')).rejects.toThrow(NestInviteNotFoundException)
    })

    it('throws InviteNotPendingException when invite is not pending', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1', status: NestInviteStatus.ACCEPTED })

      await expect(policy.assertCanAccept(invite, 'user-1')).rejects.toThrow(InviteNotPendingException)
    })

    it('throws AlreadyMemberException when actor is already a member', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1', status: NestInviteStatus.PENDING })
      memberRepo.exists.mockResolvedValue(true)
      banRepo.existsActive.mockResolvedValue(false)

      await expect(policy.assertCanAccept(invite, 'user-1')).rejects.toThrow(AlreadyMemberException)
    })

    it('throws UserIsBannedException when actor has an active ban', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1', status: NestInviteStatus.PENDING })
      memberRepo.exists.mockResolvedValue(false)
      banRepo.existsActive.mockResolvedValue(true)

      await expect(policy.assertCanAccept(invite, 'user-1')).rejects.toThrow(UserIsBannedException)
    })
  })

  describe('assertCanDecline', () => {
    it('allows when invite belongs to actor and is pending', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1', status: NestInviteStatus.PENDING })

      await expect(policy.assertCanDecline(invite, 'user-1')).resolves.toBeUndefined()
    })

    it('throws NestInviteNotFoundException when invite belongs to a different user', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1' })

      await expect(policy.assertCanDecline(invite, 'other-user')).rejects.toThrow(NestInviteNotFoundException)
    })

    it('throws InviteNotPendingException when invite is not pending', async () => {
      const invite = createNestInvitePolicySubject({ userId: 'user-1', status: NestInviteStatus.DECLINED })

      await expect(policy.assertCanDecline(invite, 'user-1')).rejects.toThrow(InviteNotPendingException)
    })
  })

  describe('assertCanRevoke', () => {
    it('allows when actor can manage invites and invite is pending', async () => {
      const invite = createNestInvitePolicySubject({ status: NestInviteStatus.PENDING })
      givenContext({ canManageInvites: true })

      await expect(policy.assertCanRevoke(invite, 'actor-1')).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canManageInvites is false', async () => {
      const invite = createNestInvitePolicySubject({ status: NestInviteStatus.PENDING })
      givenContext({ canManageInvites: false })

      await expect(policy.assertCanRevoke(invite, 'actor-1')).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InviteNotPendingException when invite is not pending', async () => {
      const invite = createNestInvitePolicySubject({ status: NestInviteStatus.ACCEPTED })
      givenContext({ canManageInvites: true })

      await expect(policy.assertCanRevoke(invite, 'actor-1')).rejects.toThrow(InviteNotPendingException)
    })
  })
})
