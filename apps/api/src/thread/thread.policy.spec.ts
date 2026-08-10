import { NestMemberRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createNestMember } from 'test/factories/nest-member.factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createThreadAccessContext } from 'test/factories/thread-access-context.factory'
import { createMockThreadAccess } from 'test/factories/thread-access.mock-factory'
import { createThreadPolicySubject } from 'test/factories/thread-policy-subject.factory'
import { ThreadNotFoundException } from './exceptions/thread-not-found.exception'
import { ThreadPolicy } from './thread.policy'

describe('ThreadPolicy', () => {
  const nestAccess = createMockNestAccess()
  const threadAccess = createMockThreadAccess()
  const memberRepo = createMockNestMemberRepository()
  const policy = new ThreadPolicy(nestAccess as any, threadAccess as any, memberRepo as any)

  const thread = createThreadPolicySubject()

  const givenNestContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  const givenThreadContext = (overrides: Parameters<typeof createThreadAccessContext>[0]) =>
    threadAccess.getContext.mockResolvedValue(createThreadAccessContext(overrides))

  const givenAuthorMembership = (role: NestMemberRole | null) =>
    memberRepo.findByUser.mockResolvedValue(role ? createNestMember({ role }) : null)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanCreateThread', () => {
    it('allows when canCreateThread is true', async () => {
      givenNestContext({ canCreateThread: true })

      await expect(
        policy.assertCanCreateThread('nest-1', 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canCreateThread is false', async () => {
      givenNestContext({ canCreateThread: false })

      await expect(
        policy.assertCanCreateThread('nest-1', 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanReadThreadContext', () => {
    it('allows when canViewThread is true', async () => {
      const ctx = createThreadAccessContext({ canViewThread: true })

      await expect(
        policy.assertCanReadThreadContext(ctx),
      ).resolves.toBeUndefined()
    })

    it('throws ThreadNotFoundException when canViewThread is false', async () => {
      const ctx = createThreadAccessContext({ canViewThread: false })

      await expect(
        policy.assertCanReadThreadContext(ctx),
      ).rejects.toThrow(ThreadNotFoundException)
    })
  })

  describe('assertCanReadThread', () => {
    it('builds the context itself and resolves with it when canViewThread is true', async () => {
      const ctx = createThreadAccessContext({ canViewThread: true })
      givenThreadContext({ canViewThread: true })

      await expect(
        policy.assertCanReadThread(thread, 'user-1'),
      ).resolves.toEqual(ctx)
    })

    it('throws ThreadNotFoundException when canViewThread is false', async () => {
      givenThreadContext({ canViewThread: false })

      await expect(
        policy.assertCanReadThread(thread, 'user-1'),
      ).rejects.toThrow(ThreadNotFoundException)
    })
  })

  describe('assertCanReadThreads', () => {
    it('allows when canViewNest is true', async () => {
      givenNestContext({ canViewNest: true })

      await expect(
        policy.assertCanReadThreads('nest-1', 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canViewNest is false', async () => {
      givenNestContext({ canViewNest: false })

      await expect(
        policy.assertCanReadThreads('nest-1', 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanUpdateThread', () => {
    it('allows when canViewThread and canEditThread are true', async () => {
      givenThreadContext({ canViewThread: true, canEditThread: true })

      await expect(
        policy.assertCanUpdateThread(thread, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws ThreadNotFoundException when canViewThread is false', async () => {
      givenThreadContext({ canViewThread: false })

      await expect(
        policy.assertCanUpdateThread(thread, 'user-1'),
      ).rejects.toThrow(ThreadNotFoundException)
    })

    it('throws InsufficientPermissionsException when canEditThread is false', async () => {
      givenThreadContext({ canViewThread: true, canEditThread: false })

      await expect(
        policy.assertCanUpdateThread(thread, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanDeleteThread', () => {
    it('allows the author to delete their own thread without a role check', async () => {
      givenThreadContext({ canViewThread: true, canDeleteThread: true })

      await expect(
        policy.assertCanDeleteThread(thread, thread.authorId),
      ).resolves.toBeUndefined()

      expect(nestAccess.getContext).not.toHaveBeenCalled()
    })

    it('allows a higher-ranked moderator to delete another member\'s thread', async () => {
      givenThreadContext({ canViewThread: true, canDeleteThread: true, role: NestMemberRole.MODERATOR })
      givenAuthorMembership(NestMemberRole.MEMBER)

      await expect(
        policy.assertCanDeleteThread(thread, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('allows deletion when the author is no longer a member of the nest', async () => {
      givenThreadContext({ canViewThread: true, canDeleteThread: true, role: NestMemberRole.MODERATOR })
      givenAuthorMembership(null)

      await expect(
        policy.assertCanDeleteThread(thread, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws ThreadNotFoundException when canViewThread is false', async () => {
      givenThreadContext({ canViewThread: false })

      await expect(
        policy.assertCanDeleteThread(thread, 'user-1'),
      ).rejects.toThrow(ThreadNotFoundException)
    })

    it('throws InsufficientPermissionsException when canDeleteThread is false', async () => {
      givenThreadContext({ canViewThread: true, canDeleteThread: false })

      await expect(
        policy.assertCanDeleteThread(thread, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when the author outranks the actor', async () => {
      givenThreadContext({ canViewThread: true, canDeleteThread: true, role: NestMemberRole.MODERATOR })
      givenAuthorMembership(NestMemberRole.OWNER)

      await expect(
        policy.assertCanDeleteThread(thread, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanManageThreadLock', () => {
    it('allows a higher-ranked moderator to lock another member\'s thread', async () => {
      givenThreadContext({ canViewThread: true, canManageThreadLock: true, role: NestMemberRole.MODERATOR })
      givenAuthorMembership(NestMemberRole.MEMBER)

      await expect(
        policy.assertCanManageThreadLock(thread, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws ThreadNotFoundException when canViewThread is false', async () => {
      givenThreadContext({ canViewThread: false })

      await expect(
        policy.assertCanManageThreadLock(thread, 'user-1'),
      ).rejects.toThrow(ThreadNotFoundException)
    })

    it('throws InsufficientPermissionsException when canManageThreadLock is false', async () => {
      givenThreadContext({ canViewThread: true, canManageThreadLock: false })

      await expect(
        policy.assertCanManageThreadLock(thread, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when the author outranks the actor', async () => {
      givenThreadContext({ canViewThread: true, canManageThreadLock: true, role: NestMemberRole.MODERATOR })
      givenAuthorMembership(NestMemberRole.OWNER)

      await expect(
        policy.assertCanManageThreadLock(thread, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanManageThreadPin', () => {
    it('allows a higher-ranked moderator to pin another member\'s thread', async () => {
      givenThreadContext({ canViewThread: true, canManageThreadPin: true, role: NestMemberRole.MODERATOR })
      givenAuthorMembership(NestMemberRole.MEMBER)

      await expect(
        policy.assertCanManageThreadPin(thread, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws ThreadNotFoundException when canViewThread is false', async () => {
      givenThreadContext({ canViewThread: false })

      await expect(
        policy.assertCanManageThreadPin(thread, 'user-1'),
      ).rejects.toThrow(ThreadNotFoundException)
    })

    it('throws InsufficientPermissionsException when canManageThreadPin is false', async () => {
      givenThreadContext({ canViewThread: true, canManageThreadPin: false })

      await expect(
        policy.assertCanManageThreadPin(thread, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when the author outranks the actor', async () => {
      givenThreadContext({ canViewThread: true, canManageThreadPin: true, role: NestMemberRole.MODERATOR })
      givenAuthorMembership(NestMemberRole.OWNER)

      await expect(
        policy.assertCanManageThreadPin(thread, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanVoteThread', () => {
    it('allows when canViewThread and canVoteThread are true', async () => {
      givenThreadContext({ canViewThread: true, canVoteThread: true })

      await expect(
        policy.assertCanVoteThread(thread, 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws ThreadNotFoundException when canViewThread is false', async () => {
      givenThreadContext({ canViewThread: false })

      await expect(
        policy.assertCanVoteThread(thread, 'user-1'),
      ).rejects.toThrow(ThreadNotFoundException)
    })

    it('throws InsufficientPermissionsException when canVoteThread is false', async () => {
      givenThreadContext({ canViewThread: true, canVoteThread: false })

      await expect(
        policy.assertCanVoteThread(thread, 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('does not require the actor to outrank the author, unlike lock/pin/delete', async () => {
      givenThreadContext({ canViewThread: true, canVoteThread: true, role: NestMemberRole.MEMBER })

      await expect(
        policy.assertCanVoteThread(thread, 'user-1'),
      ).resolves.toBeUndefined()

      expect(memberRepo.findByUser).not.toHaveBeenCalled()
    })
  })
})
