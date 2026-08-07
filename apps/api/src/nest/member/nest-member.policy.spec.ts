import { NestJoinPolicy, NestMemberRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createNestMember } from 'test/factories/nest-member.factory'
import { createNestPolicySubject } from 'test/factories/nest-policy-subject.factory'
import { AlreadyMemberException } from './exceptions/already-member.exception'
import { CannotAssignHigherOrEqualRoleException } from './exceptions/cannot-assign-higher-or-equal-role.exception'
import { CannotChangeYourOwnRoleException } from './exceptions/cannot-change-your-own-role.exception'
import { CannotManageHigherRoleMemberException } from './exceptions/cannot-manage-higher-role-member.exception'
import { CannotRemoveYourselfException } from './exceptions/cannot-remove-yourself.exception'
import { JoinNotOpenException } from './exceptions/join-not-open.exception'
import { MemberNotFoundException } from './exceptions/member-not-found.exception'
import { MemberRoleUnchangedException } from './exceptions/member-role-unchanged.exception'
import { OwnerCannotLeaveException } from './exceptions/owner-cannot-leave.exception'
import { UserIsBannedException } from './exceptions/user-is-banned.exception'
import { NestMemberPolicy } from './nest-member.policy'

describe('NestMemberPolicy', () => {
  const nestAccess = createMockNestAccess()
  const memberRepo = createMockNestMemberRepository()
  const policy = new NestMemberPolicy(nestAccess as any, memberRepo as any)

  const nest = createNestPolicySubject()

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  const givenTarget = (overrides: Parameters<typeof createNestMember>[0]) =>
    memberRepo.getByUser.mockResolvedValue(createNestMember(overrides))

  const givenTargetFound = (overrides: Parameters<typeof createNestMember>[0]) =>
    memberRepo.findByUser.mockResolvedValue(createNestMember(overrides))

  const givenTargetNotFound = () =>
    memberRepo.findByUser.mockResolvedValue(null)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanJoinNest', () => {
    it('allows joining an open nest', async () => {
      givenContext({ isMember: false, role: null, isBanned: false, joinPolicy: NestJoinPolicy.OPEN })

      await expect(
        policy.assertCanJoinNest(nest, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws UserIsBannedException when the user is banned', async () => {
      givenContext({ isMember: false, role: null, isBanned: true, joinPolicy: NestJoinPolicy.OPEN })

      await expect(
        policy.assertCanJoinNest(nest, 'user-1'),
      ).rejects.toThrow(UserIsBannedException)
    })

    it('throws AlreadyMemberException when the user is already a member', async () => {
      givenContext({ isMember: true, role: NestMemberRole.MEMBER, isBanned: false, joinPolicy: NestJoinPolicy.OPEN })

      await expect(
        policy.assertCanJoinNest(nest, 'user-1'),
      ).rejects.toThrow(AlreadyMemberException)
    })

    it('throws JoinNotOpenException when the nest is not open', async () => {
      givenContext({ isMember: false, role: null, isBanned: false, joinPolicy: NestJoinPolicy.BY_REQUEST })

      await expect(
        policy.assertCanJoinNest(nest, 'user-1'),
      ).rejects.toThrow(JoinNotOpenException)
    })
  })

  describe('assertCanLeaveNest', () => {
    it('allows a member to leave', async () => {
      givenContext({ role: NestMemberRole.MEMBER, canLeaveNest: true })

      await expect(
        policy.assertCanLeaveNest(nest, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws OwnerCannotLeaveException when actor is the owner', async () => {
      givenContext({ role: NestMemberRole.OWNER, canLeaveNest: false })

      await expect(
        policy.assertCanLeaveNest(nest, 'user-1'),
      ).rejects.toThrow(OwnerCannotLeaveException)
    })

    it('throws InsufficientPermissionsException when canLeaveNest is false', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canLeaveNest: false })

      await expect(
        policy.assertCanLeaveNest(nest, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanListMembers', () => {
    it('allows when canViewMembers is true', async () => {
      givenContext({ canViewMembers: true })

      await expect(
        policy.assertCanListMembers(nest, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canViewMembers is false', async () => {
      givenContext({ canViewMembers: false })

      await expect(
        policy.assertCanListMembers(nest, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanRemoveMember', () => {
    it('allows a moderator to remove a member', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canRemoveMembers: true })
      givenTarget({ role: NestMemberRole.MEMBER })

      await expect(
        policy.assertCanRemoveMember(nest, 'actor-1', 'target-1'),
      ).resolves.toBeUndefined()
    })

    it('throws CannotRemoveYourselfException when actor equals target', async () => {
      await expect(
        policy.assertCanRemoveMember(nest, 'user-1', 'user-1'),
      ).rejects.toThrow(CannotRemoveYourselfException)
    })

    it('throws InsufficientPermissionsException when actor lacks canRemoveMembers', async () => {
      givenContext({ role: NestMemberRole.MEMBER, canRemoveMembers: false })

      await expect(
        policy.assertCanRemoveMember(nest, 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when actor has no role', async () => {
      givenContext({ isMember: false, role: null, canRemoveMembers: false })

      await expect(
        policy.assertCanRemoveMember(nest, 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when target has equal or higher role', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canRemoveMembers: true })
      givenTarget({ role: NestMemberRole.MODERATOR })

      await expect(
        policy.assertCanRemoveMember(nest, 'actor-1', 'target-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanChangeRole', () => {
    it('allows owner to promote a member to moderator', async () => {
      givenContext({ role: NestMemberRole.OWNER, canManageMemberRoles: true })
      givenTargetFound({ role: NestMemberRole.MEMBER })

      await expect(
        policy.assertCanChangeRole(nest, 'owner-1', 'target-1', NestMemberRole.MODERATOR),
      ).resolves.toBeUndefined()
    })

    it('throws CannotChangeYourOwnRoleException when actor equals target', async () => {
      await expect(
        policy.assertCanChangeRole(nest, 'user-1', 'user-1', NestMemberRole.MODERATOR),
      ).rejects.toThrow(CannotChangeYourOwnRoleException)
    })

    it('throws InsufficientPermissionsException when actor has no role', async () => {
      givenContext({ isMember: false, role: null, canManageMemberRoles: false })

      await expect(
        policy.assertCanChangeRole(nest, 'actor-1', 'target-1', NestMemberRole.MODERATOR),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when canManageMemberRoles is false', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageMemberRoles: false })

      await expect(
        policy.assertCanChangeRole(nest, 'actor-1', 'target-1', NestMemberRole.MODERATOR),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws MemberNotFoundException when target is not a member', async () => {
      givenContext({ role: NestMemberRole.OWNER, canManageMemberRoles: true })
      givenTargetNotFound()

      await expect(
        policy.assertCanChangeRole(nest, 'owner-1', 'target-1', NestMemberRole.MODERATOR),
      ).rejects.toThrow(MemberNotFoundException)
    })

    it('throws MemberRoleUnchangedException when new role equals current role', async () => {
      givenContext({ role: NestMemberRole.OWNER, canManageMemberRoles: true })
      givenTargetFound({ role: NestMemberRole.MODERATOR })

      await expect(
        policy.assertCanChangeRole(nest, 'owner-1', 'target-1', NestMemberRole.MODERATOR),
      ).rejects.toThrow(MemberRoleUnchangedException)
    })

    it('throws CannotManageHigherRoleMemberException when actor does not outrank target', async () => {
      givenContext({ role: NestMemberRole.MODERATOR, canManageMemberRoles: true })
      givenTargetFound({ role: NestMemberRole.MODERATOR })

      await expect(
        policy.assertCanChangeRole(nest, 'actor-1', 'target-1', NestMemberRole.MEMBER),
      ).rejects.toThrow(CannotManageHigherRoleMemberException)
    })

    it('throws CannotAssignHigherOrEqualRoleException when new role is not lower than actor', async () => {
      givenContext({ role: NestMemberRole.OWNER, canManageMemberRoles: true })
      givenTargetFound({ role: NestMemberRole.MEMBER })

      await expect(
        policy.assertCanChangeRole(nest, 'owner-1', 'target-1', NestMemberRole.OWNER),
      ).rejects.toThrow(CannotAssignHigherOrEqualRoleException)
    })
  })
})