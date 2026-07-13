import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { createCommentPolicySubject } from 'test/factories/comment-policy-subject.factory'
import { createMockThreadAccess } from 'test/factories/thread-access.mock-factory'
import { createThreadAccessContext } from 'test/factories/thread-access-context.factory'
import { createMockThreadRepository } from 'test/factories/thread-repository.mock-factory'
import { createThreadPolicySubject } from 'test/factories/thread-policy-subject.factory'
import { CommentPolicy } from './comment.policy'

describe('CommentPolicy', () => {
  const threadAccess = createMockThreadAccess()
  const threadsRepo = createMockThreadRepository()
  const policy = new CommentPolicy(threadAccess as any, threadsRepo as any)

  const givenThread = (overrides: Parameters<typeof createThreadPolicySubject>[0]) =>
    threadsRepo.getById.mockResolvedValue(createThreadPolicySubject(overrides) as any)

  const givenThreadContext = (overrides: Parameters<typeof createThreadAccessContext>[0]) =>
    threadAccess.getContext.mockResolvedValue(createThreadAccessContext(overrides))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanCreateThreadComment', () => {
    it('allows when canCommentThread is true', () => {
      expect(() =>
        policy.assertCanCreateThreadComment(createThreadAccessContext({ canCommentThread: true })),
      ).not.toThrow()
    })

    it('throws InsufficientPermissionsException when canCommentThread is false', () => {
      expect(() =>
        policy.assertCanCreateThreadComment(createThreadAccessContext({ canCommentThread: false })),
      ).toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanReadThreadComment', () => {
    it('allows when canViewThread is true', () => {
      expect(() =>
        policy.assertCanReadThreadComment(createThreadAccessContext({ canViewThread: true })),
      ).not.toThrow()
    })

    it('throws ThreadNotFoundException when canViewThread is false', () => {
      expect(() =>
        policy.assertCanReadThreadComment(createThreadAccessContext({ canViewThread: false })),
      ).toThrow(ThreadNotFoundException)
    })
  })

  describe('assertCanUpdateComment', () => {
    it('allows when comment is not deleted, visible, and user is the author', () => {
      const comment = createCommentPolicySubject({ authorId: 'user-1' })

      expect(() =>
        policy.assertCanUpdateComment(
          comment,
          'user-1',
          createThreadAccessContext({ canViewThread: true }),
        ),
      ).not.toThrow()
    })

    it('throws InsufficientPermissionsException when comment is deleted', () => {
      const comment = createCommentPolicySubject({ authorId: 'user-1', deletedAt: new Date() })

      expect(() =>
        policy.assertCanUpdateComment(
          comment,
          'user-1',
          createThreadAccessContext({ canViewThread: true }),
        ),
      ).toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when thread is not visible', () => {
      const comment = createCommentPolicySubject({ authorId: 'user-1' })

      expect(() =>
        policy.assertCanUpdateComment(
          comment,
          'user-1',
          createThreadAccessContext({ canViewThread: false }),
        ),
      ).toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when user is not the author', () => {
      const comment = createCommentPolicySubject({ authorId: 'author-1' })

      expect(() =>
        policy.assertCanUpdateComment(
          comment,
          'user-1',
          createThreadAccessContext({ canViewThread: true }),
        ),
      ).toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanDeleteComment', () => {
    it('allows when user is the author', async () => {
      givenThread({})
      givenThreadContext({ canViewThread: true })

      await expect(
        policy.assertCanDeleteComment(
          createCommentPolicySubject({ authorId: 'user-1' }),
          'user-1',
        ),
      ).resolves.toBeUndefined()
    })

    it('allows when user is not the author but can moderate content', async () => {
      givenThread({})
      givenThreadContext({ canViewThread: true, canModerateContent: true })

      await expect(
        policy.assertCanDeleteComment(
          createCommentPolicySubject({ authorId: 'author-1' }),
          'user-1',
        ),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when comment is already deleted', async () => {
      givenThread({})
      givenThreadContext({ canViewThread: true })

      await expect(
        policy.assertCanDeleteComment(
          createCommentPolicySubject({ authorId: 'user-1', deletedAt: new Date() }),
          'user-1',
        ),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when thread is not visible', async () => {
      givenThread({})
      givenThreadContext({ canViewThread: false })

      await expect(
        policy.assertCanDeleteComment(
          createCommentPolicySubject({ authorId: 'user-1' }),
          'user-1',
        ),
      ).rejects.toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when user is not the author and cannot moderate', async () => {
      givenThread({})
      givenThreadContext({ canViewThread: true, canModerateContent: false })

      await expect(
        policy.assertCanDeleteComment(
          createCommentPolicySubject({ authorId: 'author-1' }),
          'user-1',
        ),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanReplyToComment', () => {
    it('allows when canCommentThread is true and comment is not deleted', () => {
      expect(() =>
        policy.assertCanReplyToComment(
          createCommentPolicySubject({ deletedAt: null }),
          createThreadAccessContext({ canCommentThread: true }),
        ),
      ).not.toThrow()
    })

    it('throws InsufficientPermissionsException when canCommentThread is false', () => {
      expect(() =>
        policy.assertCanReplyToComment(
          createCommentPolicySubject({ deletedAt: null }),
          createThreadAccessContext({ canCommentThread: false }),
        ),
      ).toThrow(InsufficientPermissionsException)
    })

    it('throws InsufficientPermissionsException when comment is deleted', () => {
      expect(() =>
        policy.assertCanReplyToComment(
          createCommentPolicySubject({ deletedAt: new Date() }),
          createThreadAccessContext({ canCommentThread: true }),
        ),
      ).toThrow(InsufficientPermissionsException)
    })
  })
})
