import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createThreadAccessContext } from 'test/factories/thread-access-context.factory'
import { createMockThreadAccess } from 'test/factories/thread-access.mock-factory'
import { createThreadPolicySubject } from 'test/factories/thread-policy-subject.factory'
import { ThreadNotFoundException } from './exceptions/thread-not-found.exception'
import { ThreadPolicy } from './thread.policy'

describe('ThreadPolicy', () => {
  const nestAccess = createMockNestAccess()
  const threadAccess = createMockThreadAccess()
  const policy = new ThreadPolicy(nestAccess as any, threadAccess as any)

  const thread = createThreadPolicySubject()

  const givenNestContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  const givenThreadContext = (overrides: Parameters<typeof createThreadAccessContext>[0]) =>
    threadAccess.getContext.mockResolvedValue(createThreadAccessContext(overrides))

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

  describe('assertCanReadThread', () => {
    it('allows when canViewThread is true', async () => {
      const ctx = createThreadAccessContext({ canViewThread: true })

      await expect(
        policy.assertCanReadThread(ctx),
      ).resolves.toBeUndefined()
    })

    it('throws ThreadNotFoundException when canViewThread is false', async () => {
      const ctx = createThreadAccessContext({ canViewThread: false })

      await expect(
        policy.assertCanReadThread(ctx),
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
    it('allows when canViewThread and canDeleteThread are true', async () => {
      givenThreadContext({ canViewThread: true, canDeleteThread: true })

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
  })

  describe('assertCanManageThreadLock', () => {
    it('allows when canViewThread and canManageThreadLock are true', async () => {
      givenThreadContext({ canViewThread: true, canManageThreadLock: true })

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
  })

  describe('assertCanManageThreadPin', () => {
    it('allows when canViewThread and canManageThreadPin are true', async () => {
      givenThreadContext({ canViewThread: true, canManageThreadPin: true })

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
  })
})
