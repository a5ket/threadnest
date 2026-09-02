import { VoteType } from 'generated/prisma/enums'
import { createMockBlockService } from 'test/factories/block-service.mock-factory'
import { createCommentPolicySubject } from 'test/factories/comment-policy-subject.factory'
import { createMockCommentPolicy } from 'test/factories/comment-policy.mock-factory'
import { createMockCommentPresenter } from 'test/factories/comment-presenter.mock-factory'
import { createMockCommentRepository } from 'test/factories/comment-repository.mock-factory'
import { createMockCommentVoteRepository } from 'test/factories/comment-vote-repository.mock-factory'
import { createComment } from 'test/factories/comment.factory'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockLogger } from 'test/factories/logger.mock-factory'
import { createThreadAccessContext } from 'test/factories/thread-access-context.factory'
import { createMockThreadAccess } from 'test/factories/thread-access.mock-factory'
import { createThreadDetails } from 'test/factories/thread-details.factory'
import { createThreadPolicySubject } from 'test/factories/thread-policy-subject.factory'
import { createMockThreadService } from 'test/factories/thread-service.mock-factory'
import { createMockTransactionManager } from 'test/factories/transaction-manager.mock-factory'
import { InvalidAttachmentKeyException } from 'src/attachment/exceptions/invalid-attachment-key.exception'
import { CommentAlreadyDeletedException } from './exceptions/comment-already-deleted.exception'
import { CommentUpdatedEvent } from './events/comment-updated.event'
import { CommentService } from './comment.service'

describe('CommentService', () => {
  const repo = createMockCommentRepository()
  const commentVotesRepo = createMockCommentVoteRepository()
  const threads = createMockThreadService()
  const threadAccess = createMockThreadAccess()
  const commentPolicy = createMockCommentPolicy()
  const commentPresenter = createMockCommentPresenter()
  const transactionManager = createMockTransactionManager()
  const blocks = createMockBlockService()
  const eventBus = createMockEventBus()
  const logger = createMockLogger()

  const service = new CommentService(
    repo as any,
    commentVotesRepo as any,
    threads as any,
    threadAccess as any,
    commentPolicy as any,
    commentPresenter as any,
    transactionManager as any,
    blocks as any,
    eventBus,
    logger as any,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    blocks.exists.mockResolvedValue(false)
  })

  describe('listCommentsByThreadSlug', () => {
    it('checks read access on the thread and presents the tree', async () => {
      const thread = createThreadPolicySubject({ id: 'thread-1', nestId: 'nest-1' })
      const ctx = createThreadAccessContext({ canModerateContent: true })
      const page = { items: [], meta: { total: 0, limit: 20, hasMore: false, nextCursor: null } }

      threads.getByNestSlug.mockResolvedValue(thread as any)
      threadAccess.getContext.mockResolvedValue(ctx)
      repo.getByThread.mockResolvedValue(page)
      commentPresenter.toTreePage.mockResolvedValue({ items: [], meta: page.meta })

      await service.listCommentsByThreadSlug('nest-slug', 'thread-slug', 'viewer-1', {} as any)

      expect(commentPolicy.assertCanReadThreadComment).toHaveBeenCalledWith(ctx)
      expect(repo.getByThread).toHaveBeenCalledWith('thread-1', 'nest-1', 'viewer-1', {})
      expect(commentPresenter.toTreePage).toHaveBeenCalledWith(page, true)
    })
  })

  describe('listCommentReplies', () => {
    it('resolves the parent comment and thread, then presents the reply tree', async () => {
      const comment = createCommentPolicySubject({ id: 'comment-1', threadId: 'thread-1' })
      const thread = createThreadPolicySubject({ id: 'thread-1', nestId: 'nest-1' })
      const ctx = createThreadAccessContext()
      const page = { items: [], meta: { total: 0, limit: 20, hasMore: false, nextCursor: null } }

      repo.getById.mockResolvedValue(comment as any)
      threads.getById.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(ctx)
      repo.getReplies.mockResolvedValue(page)
      commentPresenter.toTreePage.mockResolvedValue({ items: [], meta: page.meta })

      await service.listCommentReplies('comment-1', null, {} as any)

      expect(repo.getReplies).toHaveBeenCalledWith('comment-1', 'nest-1', null, {})
    })
  })

  describe('createThreadCommentByThreadSlug', () => {
    const dto = { content: 'hello', attachment: undefined }

    it('creates the comment, bumps the comment count, updates lastCommentAt, and publishes CommentCreatedEvent', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', authorId: 'thread-author' })
      const ctx = createThreadAccessContext()
      const created = createComment({ id: 'comment-1', createdAt: new Date('2024-02-01T00:00:00.000Z') })

      threads.getByNestSlug.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(ctx)
      repo.create.mockResolvedValue(created)
      commentPresenter.toView.mockResolvedValue({ id: 'view' } as any)

      await service.createThreadCommentByThreadSlug('nest-slug', 'thread-slug', 'actor-1', dto)

      expect(commentPolicy.assertCanCreateThreadComment).toHaveBeenCalledWith(ctx)
      expect(repo.create).toHaveBeenCalledWith('thread-1', 'actor-1', 'nest-1', dto, {})
      expect(threads.adjustCommentCount).toHaveBeenCalledWith('thread-1', 1, {})
      expect(threads.updateLastCommentAt).toHaveBeenCalledWith('thread-1', created.createdAt, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({ recipientId: 'thread-author', parentCommentId: null }),
      }))
    })

    it('sets recipientId to null when the actor comments on their own thread', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', authorId: 'actor-1' })
      threads.getByNestSlug.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      repo.create.mockResolvedValue(createComment())
      commentPresenter.toView.mockResolvedValue({ id: 'view' } as any)

      await service.createThreadCommentByThreadSlug('nest-slug', 'thread-slug', 'actor-1', dto)

      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({ recipientId: null }),
      }))
    })

    it('rejects an attachment key not owned by the actor without touching the repository', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      threads.getByNestSlug.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())

      await expect(
        service.createThreadCommentByThreadSlug('nest-slug', 'thread-slug', 'actor-1', {
          content: 'hi', attachment: { key: 'attachments/someone-else/x.png', width: 1, height: 1 },
        } as any),
      ).rejects.toThrow(InvalidAttachmentKeyException)

      expect(repo.create).not.toHaveBeenCalled()
    })
  })

  describe('createCommentReply', () => {
    const dto = { content: 'a reply', attachment: undefined }

    it('creates the reply and publishes CommentCreatedEvent addressed to the parent author', async () => {
      const parent = createComment({ id: 'parent-1', threadId: 'thread-1', author: { id: 'parent-author', profile: null } })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const reply = createComment({ id: 'reply-1', parentId: 'parent-1', createdAt: new Date('2024-02-01T00:00:00.000Z') })

      repo.getById.mockResolvedValue(parent)
      threads.getById.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      repo.createReply.mockResolvedValue(reply)
      commentPresenter.toView.mockResolvedValue({ id: 'view' } as any)

      await service.createCommentReply('parent-1', 'actor-1', dto)

      expect(commentPolicy.assertCanReplyToComment).toHaveBeenCalledWith(parent, expect.anything())
      expect(repo.createReply).toHaveBeenCalledWith(parent, 'actor-1', 'nest-1', dto, {})
      expect(threads.adjustCommentCount).toHaveBeenCalledWith('thread-1', 1, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({ recipientId: 'parent-author', parentCommentId: 'parent-1' }),
      }))
    })

    it('rejects an attachment key not owned by the actor without touching the repository', async () => {
      const parent = createComment({ id: 'parent-1', threadId: 'thread-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })

      repo.getById.mockResolvedValue(parent)
      threads.getById.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())

      await expect(
        service.createCommentReply('parent-1', 'actor-1', {
          content: 'hi', attachment: { key: 'attachments/someone-else/x.png', width: 1, height: 1 },
        } as any),
      ).rejects.toThrow(InvalidAttachmentKeyException)

      expect(repo.createReply).not.toHaveBeenCalled()
    })
  })

  describe('getCommentById', () => {
    it('re-fetches with the viewer-aware select after checking access', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const withRole = createComment({ id: 'comment-1' })

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      repo.getByIdForViewer.mockResolvedValue(withRole)
      commentPresenter.toView.mockResolvedValue({ id: 'view' } as any)

      await service.getCommentById('comment-1', 'viewer-1')

      expect(repo.getByIdForViewer).toHaveBeenCalledWith('comment-1', 'nest-1', 'viewer-1')
    })

    it('does not compute block flags for an anonymous viewer', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      repo.getByIdForViewer.mockResolvedValue(comment)
      commentPresenter.toView.mockResolvedValue({ id: 'view' } as any)

      await service.getCommentById('comment-1', null)

      expect(blocks.exists).not.toHaveBeenCalled()
      expect(commentPresenter.toView).toHaveBeenCalledWith(comment, { viewerBlockedAuthor: false, authorBlockedViewer: false }, false)
    })
  })

  describe('updateComment', () => {
    it('updates the comment and publishes CommentUpdatedEvent', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1', authorId: 'actor-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const updated = createComment({ id: 'comment-1', content: 'edited' })

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      repo.updateById.mockResolvedValue(updated)
      commentPresenter.toView.mockResolvedValue({ id: 'view' } as any)

      await service.updateComment('comment-1', 'actor-1', { content: 'edited' })

      expect(commentPolicy.assertCanUpdateComment).toHaveBeenCalledWith(comment, 'actor-1', expect.anything())
      expect(repo.updateById).toHaveBeenCalledWith('comment-1', 'nest-1', { content: 'edited' }, 'actor-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(CommentUpdatedEvent))
    })
  })

  describe('removeComment', () => {
    it('soft-deletes as a nest-moderation removal and publishes CommentDeletedEvent', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1', parentId: 'parent-1', author: { id: 'author-1', profile: null } })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      repo.getLatestCommentByThreadId.mockResolvedValue(null)

      await service.removeComment('comment-1', 'moderator-1')

      expect(commentPolicy.assertCanDeleteComment).toHaveBeenCalledWith(comment, 'moderator-1')
      expect(repo.softDeleteById).toHaveBeenCalledWith('comment-1', 'moderator-1', {}, false)
      expect(repo.decrementReplyCount).toHaveBeenCalledWith('parent-1', {})
      expect(threads.adjustCommentCount).toHaveBeenCalledWith('thread-1', -1, {})
      expect(threads.updateLastCommentAt).toHaveBeenCalledWith('thread-1', thread.createdAt, {})
      expect(logger.info).toHaveBeenCalled()
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({ recipientId: 'author-1', deletedById: 'moderator-1' }),
      }))
    })

    it('uses the latest remaining comment for lastCommentAt when one exists', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const latest = { createdAt: new Date('2024-03-01T00:00:00.000Z') }

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      repo.getLatestCommentByThreadId.mockResolvedValue(latest)

      await service.removeComment('comment-1', 'author-1')

      expect(threads.updateLastCommentAt).toHaveBeenCalledWith('thread-1', latest.createdAt, {})
    })

    it('does not log a moderation notice when the author removes their own comment', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1', author: { id: 'author-1', profile: null } })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      repo.getLatestCommentByThreadId.mockResolvedValue(null)

      await service.removeComment('comment-1', 'author-1')

      expect(logger.info).not.toHaveBeenCalled()
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({ recipientId: null }),
      }))
    })
  })

  describe('removeByPlatform', () => {
    it('soft-deletes with the platform flag and returns the comment and thread', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1', deletedAt: null })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      repo.getLatestCommentByThreadId.mockResolvedValue(null)

      const result = await service.removeByPlatform('comment-1', 'admin-1')

      expect(repo.softDeleteById).toHaveBeenCalledWith('comment-1', 'admin-1', {}, true)
      expect(result).toEqual({ comment, thread })
    })

    it('throws CommentAlreadyDeletedException when the comment is already deleted', async () => {
      const comment = createComment({ id: 'comment-1', deletedAt: new Date() })
      repo.getById.mockResolvedValue(comment)

      await expect(service.removeByPlatform('comment-1', 'admin-1')).rejects.toThrow(CommentAlreadyDeletedException)

      expect(repo.softDeleteById).not.toHaveBeenCalled()
    })
  })

  describe('removeAllByAuthorPlatform', () => {
    it('returns 0 and skips the transaction when the author has no active comments', async () => {
      repo.listActiveByAuthor.mockResolvedValue([])

      const result = await service.removeAllByAuthorPlatform('author-1', 'admin-1')

      expect(result).toBe(0)
      expect(transactionManager.run).not.toHaveBeenCalled()
    })

    it('soft-deletes all comments, decrements parent reply counts, and recomputes lastCommentAt per affected thread', async () => {
      repo.listActiveByAuthor.mockResolvedValue([
        { id: 'c1', threadId: 'thread-1', parentId: 'parent-1' },
        { id: 'c2', threadId: 'thread-1', parentId: null },
        { id: 'c3', threadId: 'thread-2', parentId: 'parent-2' },
      ])
      threads.getById.mockResolvedValue(createThreadDetails({ id: 'thread-2', createdAt: new Date('2024-01-05T00:00:00.000Z') }))
      repo.getLatestCommentByThreadId.mockResolvedValue(null)

      const result = await service.removeAllByAuthorPlatform('author-1', 'admin-1')

      expect(repo.softDeleteManyByAuthor).toHaveBeenCalledWith('author-1', 'admin-1', {})
      expect(repo.decrementReplyCount).toHaveBeenCalledWith('parent-1', {})
      expect(repo.decrementReplyCount).toHaveBeenCalledWith(null, {})
      expect(repo.decrementReplyCount).toHaveBeenCalledWith('parent-2', {})
      expect(threads.adjustCommentCount).toHaveBeenCalledWith('thread-1', -2, {})
      expect(threads.adjustCommentCount).toHaveBeenCalledWith('thread-2', -1, {})
      expect(result).toBe(3)
    })
  })

  describe('voteOnComment', () => {
    it('reads the current vote, upserts the new one, and adjusts the score by the resulting delta', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const updated = createComment({ id: 'comment-1', score: 1 })

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      commentVotesRepo.find.mockResolvedValue(null)
      repo.adjustScore.mockResolvedValue(updated)
      commentPresenter.toView.mockResolvedValue({ id: 'view' } as any)

      await service.voteOnComment('comment-1', 'actor-1', VoteType.UPVOTE)

      expect(commentPolicy.assertCanVoteOnComment).toHaveBeenCalledWith(comment, expect.anything())
      expect(commentVotesRepo.upsert).toHaveBeenCalledWith('comment-1', 'actor-1', VoteType.UPVOTE, {})
      expect(repo.adjustScore).toHaveBeenCalledWith('comment-1', 1, 'nest-1', 'actor-1', {})
    })
  })

  describe('removeCommentVote', () => {
    it('deletes the vote and reverses its effect on the score', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const updated = createComment({ id: 'comment-1', score: 0 })

      repo.getById.mockResolvedValue(comment)
      threads.getById.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      commentVotesRepo.find.mockResolvedValue({ type: VoteType.UPVOTE })
      repo.adjustScore.mockResolvedValue(updated)
      commentPresenter.toView.mockResolvedValue({ id: 'view' } as any)

      await service.removeCommentVote('comment-1', 'actor-1')

      expect(commentVotesRepo.delete).toHaveBeenCalledWith('comment-1', 'actor-1', {})
      expect(repo.adjustScore).toHaveBeenCalledWith('comment-1', -1, 'nest-1', 'actor-1', {})
    })
  })

  describe('listByAuthor', () => {
    it('presents each item as an author-item view', async () => {
      const page = { items: [{ id: 'c1' }], meta: { nextCursor: null, hasMore: false } }
      repo.listByAuthor.mockResolvedValue(page as any)
      commentPresenter.toAuthorItemView.mockResolvedValue({ id: 'view' } as any)

      const result = await service.listByAuthor('author-1', 'viewer-1', {} as any)

      expect(repo.listByAuthor).toHaveBeenCalledWith('author-1', 'viewer-1', {})
      expect(result).toEqual({ items: [{ id: 'view' }], meta: page.meta })
    })
  })
})
