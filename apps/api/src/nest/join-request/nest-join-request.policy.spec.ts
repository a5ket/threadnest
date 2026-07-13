import { NestJoinPolicy, NestJoinRequestStatus } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createNestJoinRequestPolicySubject } from 'test/factories/nest-join-request-policy-subject.factory'
import { createNestPolicySubject } from 'test/factories/nest-policy-subject.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createMockNestBanRepository } from 'test/factories/nest-ban-repository.mock-factory'
import { createMockNestInviteRepository } from 'test/factories/nest-invite-repository.mock-factory'
import { createMockNestJoinRequestRepository } from 'test/factories/nest-join-request-repository.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { AlreadyInvitedException } from '../invite/exceptions/already-invited.exception'
import { AlreadyMemberException } from '../member/exceptions/already-member.exception'
import { UserIsBannedException } from '../member/exceptions/user-is-banned.exception'
import { AlreadyHasPendingJoinRequestException } from './exceptions/already-has-pending-join-request.exception'
import { JoinRequestNotPendingException } from './exceptions/join-request-not-pending.exception'
import { JoinRequestsNotAcceptedException } from './exceptions/join-requests-not-accepted.exception'
import { NestJoinRequestNotFoundException } from './exceptions/nest-join-request-not-found.exception'
import { NestJoinRequestPolicy } from './nest-join-request.policy'

describe('NestJoinRequestPolicy', () => {
  const nestAccess = createMockNestAccess()
  const requestRepo = createMockNestJoinRequestRepository()
  const memberRepo = createMockNestMemberRepository()
  const banRepo = createMockNestBanRepository()
  const inviteRepo = createMockNestInviteRepository()
  const policy = new NestJoinRequestPolicy(
    nestAccess as any,
    requestRepo as any,
    memberRepo as any,
    banRepo as any,
    inviteRepo as any,
  )

  const nest = createNestPolicySubject()
  const request = createNestJoinRequestPolicySubject()

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  const givenCanCreateDefaults = () => {
    givenContext({ joinPolicy: NestJoinPolicy.BY_REQUEST, isMember: false, isBanned: false })
    requestRepo.existsPending.mockResolvedValue(false)
    inviteRepo.existsPending.mockResolvedValue(false)
  }

  const givenCanApproveDefaults = () => {
    givenContext({ canManageJoinRequests: true })
    memberRepo.exists.mockResolvedValue(false)
    banRepo.existsActive.mockResolvedValue(false)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanCreate', () => {
    it('allows creating a join request when all conditions are met', async () => {
      givenCanCreateDefaults()

      await expect(
        policy.assertCanCreate(nest, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws JoinRequestsNotAcceptedException when join policy is not BY_REQUEST', async () => {
      givenCanCreateDefaults()
      givenContext({ joinPolicy: NestJoinPolicy.OPEN })

      await expect(
        policy.assertCanCreate(nest, 'user-1'),
      ).rejects.toThrow(JoinRequestsNotAcceptedException)
    })

    it('throws AlreadyMemberException when actor is already a member', async () => {
      givenCanCreateDefaults()
      givenContext({ joinPolicy: NestJoinPolicy.BY_REQUEST, isMember: true, isBanned: false })

      await expect(
        policy.assertCanCreate(nest, 'user-1'),
      ).rejects.toThrow(AlreadyMemberException)
    })

    it('throws UserIsBannedException when actor is banned', async () => {
      givenCanCreateDefaults()
      givenContext({ joinPolicy: NestJoinPolicy.BY_REQUEST, isMember: false, isBanned: true })

      await expect(
        policy.assertCanCreate(nest, 'user-1'),
      ).rejects.toThrow(UserIsBannedException)
    })

    it('throws AlreadyHasPendingJoinRequestException when actor already has a pending request', async () => {
      givenCanCreateDefaults()
      requestRepo.existsPending.mockResolvedValue(true)

      await expect(
        policy.assertCanCreate(nest, 'user-1'),
      ).rejects.toThrow(AlreadyHasPendingJoinRequestException)
    })

    it('throws AlreadyInvitedException when actor has a pending invite', async () => {
      givenCanCreateDefaults()
      inviteRepo.existsPending.mockResolvedValue(true)

      await expect(
        policy.assertCanCreate(nest, 'user-1'),
      ).rejects.toThrow(AlreadyInvitedException)
    })
  })

  describe('assertCanCancel', () => {
    it('allows cancelling own pending request', async () => {
      await expect(
        policy.assertCanCancel(request, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws NestJoinRequestNotFoundException when actor is not the request owner', async () => {
      await expect(
        policy.assertCanCancel(request, 'user-2'),
      ).rejects.toThrow(NestJoinRequestNotFoundException)
    })

    it('throws JoinRequestNotPendingException when request is not pending', async () => {
      await expect(
        policy.assertCanCancel(
          createNestJoinRequestPolicySubject({ status: NestJoinRequestStatus.REJECTED }),
          'user-1',
        ),
      ).rejects.toThrow(JoinRequestNotPendingException)
    })
  })

  describe('assertCanListAsNest', () => {
    it('allows listing when actor can manage join requests', async () => {
      givenContext({ canManageJoinRequests: true })

      await expect(
        policy.assertCanListAsNest(nest, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when actor cannot manage join requests', async () => {
      givenContext({ canManageJoinRequests: false })

      await expect(
        policy.assertCanListAsNest(nest, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanGetAsUser', () => {
    it('allows getting own request', async () => {
      await expect(
        policy.assertCanGetAsUser(request, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws NestJoinRequestNotFoundException when actor is not the request owner', async () => {
      await expect(
        policy.assertCanGetAsUser(request, 'user-2'),
      ).rejects.toThrow(NestJoinRequestNotFoundException)
    })
  })

  describe('assertCanGetAsNest', () => {
    it('allows getting request as nest when actor can manage join requests', async () => {
      givenContext({ canManageJoinRequests: true })

      await expect(
        policy.assertCanGetAsNest(request, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when actor cannot manage join requests', async () => {
      givenContext({ canManageJoinRequests: false })

      await expect(
        policy.assertCanGetAsNest(request, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanApprove', () => {
    it('allows approving when actor can manage join requests and target is not member or banned', async () => {
      givenCanApproveDefaults()

      await expect(
        policy.assertCanApprove(request, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when actor cannot manage join requests', async () => {
      givenContext({ canManageJoinRequests: false })

      await expect(
        policy.assertCanApprove(request, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws JoinRequestNotPendingException when request is not pending', async () => {
      givenCanApproveDefaults()

      await expect(
        policy.assertCanApprove(
          createNestJoinRequestPolicySubject({ status: NestJoinRequestStatus.REJECTED }),
          'user-1',
        ),
      ).rejects.toThrow(JoinRequestNotPendingException)
    })

    it('throws AlreadyMemberException when target is already a member', async () => {
      givenCanApproveDefaults()
      memberRepo.exists.mockResolvedValue(true)

      await expect(
        policy.assertCanApprove(request, 'user-1'),
      ).rejects.toThrow(AlreadyMemberException)
    })

    it('throws UserIsBannedException when target is banned', async () => {
      givenCanApproveDefaults()
      banRepo.existsActive.mockResolvedValue(true)

      await expect(
        policy.assertCanApprove(request, 'user-1'),
      ).rejects.toThrow(UserIsBannedException)
    })
  })

  describe('assertCanReject', () => {
    it('allows rejecting when actor can manage join requests and request is pending', async () => {
      givenContext({ canManageJoinRequests: true })

      await expect(
        policy.assertCanReject(request, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when actor cannot manage join requests', async () => {
      givenContext({ canManageJoinRequests: false })

      await expect(
        policy.assertCanReject(request, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws JoinRequestNotPendingException when request is not pending', async () => {
      givenContext({ canManageJoinRequests: true })

      await expect(
        policy.assertCanReject(
          createNestJoinRequestPolicySubject({ status: NestJoinRequestStatus.CANCELED }),
          'user-1',
        ),
      ).rejects.toThrow(JoinRequestNotPendingException)
    })
  })
})
