import { VoteType } from 'generated/prisma/enums'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockLogger } from 'test/factories/logger.mock-factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { createMockSavedThreadRepository } from 'test/factories/saved-thread-repository.mock-factory'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createThreadAccessContext } from 'test/factories/thread-access-context.factory'
import { createMockThreadAccess } from 'test/factories/thread-access.mock-factory'
import { createThreadDetails } from 'test/factories/thread-details.factory'
import { createThreadPolicySubject } from 'test/factories/thread-policy-subject.factory'
import { createMockThreadPolicy } from 'test/factories/thread-policy.mock-factory'
import { createMockThreadPresenter } from 'test/factories/thread-presenter.mock-factory'
import { createMockThreadRepository } from 'test/factories/thread-repository.mock-factory'
import { createMockThreadVoteRepository } from 'test/factories/thread-vote-repository.mock-factory'
import { createMockTransactionManager } from 'test/factories/transaction-manager.mock-factory'
import { InvalidAttachmentKeyException } from 'src/attachment/exceptions/invalid-attachment-key.exception'
import { ThreadAlreadyDeletedException } from './exceptions/thread-already-deleted.exception'
import { ThreadCreatedEvent } from './events/thread-created.event'
import { ThreadLockedEvent } from './events/thread-locked.event'
import { ThreadPinnedEvent } from './events/thread-pinned.event'
import { ThreadUnlockedEvent } from './events/thread-unlocked.event'
import { ThreadUnpinnedEvent } from './events/thread-unpinned.event'
import { ThreadUpdatedEvent } from './events/thread-updated.event'
import { ThreadService } from './thread.service'

describe('ThreadService', () => {
  const threadsRepo = createMockThreadRepository()
  const threadVotesRepo = createMockThreadVoteRepository()
  const savedThreadsRepo = createMockSavedThreadRepository()
  const nestsRepo = createMockNestRepository()
  const threadsPolicy = createMockThreadPolicy()
  const transactionManager = createMockTransactionManager()
  const threadAccess = createMockThreadAccess()
  const threadPresenter = createMockThreadPresenter()
  const eventBus = createMockEventBus()
  const storage = createMockStorageService()
  const logger = createMockLogger()

  const service = new ThreadService(
    threadsRepo as any,
    threadVotesRepo as any,
    savedThreadsRepo as any,
    nestsRepo,
    threadsPolicy as any,
    transactionManager as any,
    threadAccess as any,
    threadPresenter as any,
    eventBus,
    storage as any,
    logger as any,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createThread', () => {
    const dto = { title: 'Title', content: 'Content', attachments: undefined }

    it('creates the thread, bumps the nest thread count, and publishes ThreadCreatedEvent', async () => {
      const nest = createNestSummary({ id: 'nest-1', slug: 'nest-slug' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const ctx = createThreadAccessContext()
      const view = { id: 'view-1' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      threadsRepo.create.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(ctx)
      threadPresenter.toDetailView.mockResolvedValue(view as any)

      const result = await service.createThread('nest-slug', 'actor-1', dto)

      expect(threadsPolicy.assertCanCreateThread).toHaveBeenCalledWith('nest-1', 'actor-1')
      expect(threadsRepo.create).toHaveBeenCalledWith('nest-1', 'actor-1', dto, {})
      expect(nestsRepo.adjustThreadCount).toHaveBeenCalledWith('nest-1', 1, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ThreadCreatedEvent))
      expect(result).toBe(view)
    })

    it('rejects an attachment key not owned by the actor without touching the repository', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(
        service.createThread('nest-slug', 'actor-1', { ...dto, attachments: [{ key: 'attachments/someone-else/x.png', width: 1, height: 1 }] } as any),
      ).rejects.toThrow(InvalidAttachmentKeyException)

      expect(threadsRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('getThread', () => {
    it('resolves by nest and thread slug and presents with the read policy context', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const thread = createThreadDetails({ id: 'thread-1' })
      const ctx = createThreadAccessContext()
      const view = { id: 'view-1' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadsPolicy.assertCanReadThread.mockResolvedValue(ctx)
      threadPresenter.toDetailView.mockResolvedValue(view as any)

      const result = await service.getThread('nest-slug', 'thread-slug', 'actor-1')

      expect(threadsRepo.getBySlug).toHaveBeenCalledWith('nest-1', 'thread-slug', 'actor-1')
      expect(threadsPolicy.assertCanReadThread).toHaveBeenCalledWith(thread, 'actor-1')
      expect(result).toBe(view)
    })
  })

  describe('getById', () => {
    it('delegates directly to the repository', async () => {
      const subject = createThreadPolicySubject({ id: 'thread-1' })
      threadsRepo.getById.mockResolvedValue(subject)

      const result = await service.getById('thread-1')

      expect(threadsRepo.getById).toHaveBeenCalledWith('thread-1')
      expect(result).toBe(subject)
    })
  })

  describe('listByNest', () => {
    it('checks read access on the nest and presents each item as a summary', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const page = { items: [createThreadDetails()], meta: { nextCursor: null, hasMore: false } }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      threadsRepo.listByNest.mockResolvedValue(page)
      threadPresenter.toSummaryView.mockResolvedValue({ id: 'summary' } as any)

      const result = await service.listByNest('nest-slug', {} as any, 'actor-1')

      expect(threadsPolicy.assertCanReadThreads).toHaveBeenCalledWith('nest-1', 'actor-1')
      expect(result).toEqual({ items: [{ id: 'summary' }], meta: page.meta })
    })
  })

  describe('searchThreads', () => {
    it('presents each result as a search-result view', async () => {
      const page = { items: [createThreadDetails()], meta: { nextCursor: null, hasMore: false } }
      threadsRepo.searchGlobal.mockResolvedValue(page)
      threadPresenter.toSearchResultView.mockResolvedValue({ id: 'result' } as any)

      const result = await service.searchThreads({ search: 'term', limit: 10 }, 'actor-1')

      expect(threadsRepo.searchGlobal).toHaveBeenCalledWith('term', 10, undefined, 'actor-1')
      expect(result).toEqual({ items: [{ id: 'result' }], meta: page.meta })
    })
  })

  describe('discoverFeed', () => {
    it('presents each item as a search-result view', async () => {
      const page = { items: [createThreadDetails()], meta: { nextCursor: null, hasMore: false } }
      threadsRepo.listDiscoverFeed.mockResolvedValue(page)
      threadPresenter.toSearchResultView.mockResolvedValue({ id: 'result' } as any)

      const result = await service.discoverFeed({} as any, 'actor-1')

      expect(result).toEqual({ items: [{ id: 'result' }], meta: page.meta })
    })
  })

  describe('updateThread', () => {
    it('updates the thread, deletes dropped attachments, and publishes ThreadUpdatedEvent', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const updated = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', title: 'New title' })
      const ctx = createThreadAccessContext()

      nestsRepo.getBySlug.mockResolvedValue(nest)
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadsRepo.updateById.mockResolvedValue({ thread: updated, droppedAttachmentKeys: ['attachments/actor-1/old.png'] })
      threadAccess.getContext.mockResolvedValue(ctx)
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      const dto = { title: 'New title' }
      await service.updateThread('nest-slug', 'thread-slug', 'actor-1', dto as any)

      expect(threadsPolicy.assertCanUpdateThread).toHaveBeenCalledWith(thread, 'actor-1')
      expect(threadsRepo.updateById).toHaveBeenCalledWith('thread-1', 'nest-1', dto, 'actor-1')
      expect(storage.delete).toHaveBeenCalledWith('attachments/actor-1/old.png')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ThreadUpdatedEvent))
    })

    it('rejects an attachment key not owned by the actor without touching the repository', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      threadsRepo.getBySlug.mockResolvedValue(thread)

      await expect(
        service.updateThread('nest-slug', 'thread-slug', 'actor-1', { attachments: [{ key: 'attachments/someone-else/x.png', width: 1, height: 1 }] } as any),
      ).rejects.toThrow(InvalidAttachmentKeyException)

      expect(threadsRepo.updateById).not.toHaveBeenCalled()
    })
  })

  describe('deleteThread', () => {
    it('soft-deletes, decrements the nest thread count, and publishes ThreadDeletedEvent as a nest-moderation removal', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', authorId: 'author-1' })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      threadsRepo.getBySlug.mockResolvedValue(thread)

      await service.deleteThread('nest-slug', 'thread-slug', 'moderator-1')

      expect(threadsPolicy.assertCanDeleteThread).toHaveBeenCalledWith(thread, 'moderator-1')
      expect(threadsRepo.softDelete).toHaveBeenCalledWith('thread-1', 'moderator-1', {}, false)
      expect(nestsRepo.adjustThreadCount).toHaveBeenCalledWith('nest-1', -1, {})
      expect(logger.info).toHaveBeenCalled()
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({ recipientId: 'author-1', deletedById: 'moderator-1' }),
      }))
    })

    it('does not log a moderation notice and sets recipientId to null when the author deletes their own thread', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', authorId: 'author-1' })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      threadsRepo.getBySlug.mockResolvedValue(thread)

      await service.deleteThread('nest-slug', 'thread-slug', 'author-1')

      expect(logger.info).not.toHaveBeenCalled()
      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({ recipientId: null }),
      }))
    })
  })

  describe('removeByPlatform', () => {
    it('soft-deletes with the platform flag and returns the thread', async () => {
      const thread = createThreadPolicySubject({ id: 'thread-1', nestId: 'nest-1', authorId: 'author-1', deletedAt: null })
      threadsRepo.getById.mockResolvedValue(thread)

      const result = await service.removeByPlatform('thread-1', 'admin-1')

      expect(threadsRepo.softDelete).toHaveBeenCalledWith('thread-1', 'admin-1', {}, true)
      expect(nestsRepo.adjustThreadCount).toHaveBeenCalledWith('nest-1', -1, {})
      expect(result).toBe(thread)
    })

    it('throws ThreadAlreadyDeletedException when the thread is already deleted', async () => {
      const thread = createThreadPolicySubject({ id: 'thread-1', deletedAt: new Date() })
      threadsRepo.getById.mockResolvedValue(thread)

      await expect(service.removeByPlatform('thread-1', 'admin-1')).rejects.toThrow(ThreadAlreadyDeletedException)

      expect(threadsRepo.softDelete).not.toHaveBeenCalled()
    })
  })

  describe('removeAllByAuthorPlatform', () => {
    it('returns 0 and skips the transaction when the author has no active threads', async () => {
      threadsRepo.listActiveByAuthor.mockResolvedValue([])

      const result = await service.removeAllByAuthorPlatform('author-1', 'admin-1')

      expect(result).toBe(0)
      expect(transactionManager.run).not.toHaveBeenCalled()
    })

    it('soft-deletes all threads and decrements each affected nest by its thread count', async () => {
      threadsRepo.listActiveByAuthor.mockResolvedValue([
        { id: 't1', nestId: 'nest-1' },
        { id: 't2', nestId: 'nest-1' },
        { id: 't3', nestId: 'nest-2' },
      ])

      const result = await service.removeAllByAuthorPlatform('author-1', 'admin-1')

      expect(threadsRepo.softDeleteManyByAuthor).toHaveBeenCalledWith('author-1', 'admin-1', {})
      expect(nestsRepo.adjustThreadCount).toHaveBeenCalledWith('nest-1', -2, {})
      expect(nestsRepo.adjustThreadCount).toHaveBeenCalledWith('nest-2', -1, {})
      expect(result).toBe(3)
    })
  })

  describe('lockThread', () => {
    it('locks the thread and publishes ThreadLockedEvent', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadsRepo.lock.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      await service.lockThread('nest-slug', 'thread-slug', 'mod-1')

      expect(threadsPolicy.assertCanManageThreadLock).toHaveBeenCalledWith(thread, 'mod-1')
      expect(threadsRepo.lock).toHaveBeenCalledWith('thread-1', 'nest-1', 'mod-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ThreadLockedEvent))
    })
  })

  describe('unlockThread', () => {
    it('unlocks the thread and publishes ThreadUnlockedEvent', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadsRepo.unlock.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      await service.unlockThread('nest-slug', 'thread-slug', 'mod-1')

      expect(threadsRepo.unlock).toHaveBeenCalledWith('thread-1', 'nest-1', 'mod-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ThreadUnlockedEvent))
    })
  })

  describe('pinThread', () => {
    it('pins the thread and publishes ThreadPinnedEvent', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadsRepo.pin.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      await service.pinThread('nest-slug', 'thread-slug', 'mod-1')

      expect(threadsRepo.pin).toHaveBeenCalledWith('thread-1', 'nest-1', 'mod-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ThreadPinnedEvent))
    })
  })

  describe('unpinThread', () => {
    it('unpins the thread and publishes ThreadUnpinnedEvent', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadsRepo.unpin.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      await service.unpinThread('nest-slug', 'thread-slug', 'mod-1')

      expect(threadsRepo.unpin).toHaveBeenCalledWith('thread-1', 'nest-1', 'mod-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ThreadUnpinnedEvent))
    })
  })

  describe('voteOnThread', () => {
    it('reads the current vote, upserts the new one, and adjusts the score by the resulting delta', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const updated = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', score: 1 })

      nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadVotesRepo.find.mockResolvedValue(null)
      threadsRepo.adjustScore.mockResolvedValue(updated)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      await service.voteOnThread('nest-slug', 'thread-slug', 'actor-1', VoteType.UPVOTE)

      expect(threadsPolicy.assertCanVoteThread).toHaveBeenCalledWith(thread, 'actor-1')
      expect(threadVotesRepo.upsert).toHaveBeenCalledWith('thread-1', 'actor-1', VoteType.UPVOTE, {})
      expect(threadsRepo.adjustScore).toHaveBeenCalledWith('thread-1', 1, 'nest-1', 'actor-1', {})
    })
  })

  describe('removeThreadVote', () => {
    it('deletes the vote and reverses its effect on the score', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const updated = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', score: 0 })

      nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadVotesRepo.find.mockResolvedValue({ type: VoteType.UPVOTE })
      threadsRepo.adjustScore.mockResolvedValue(updated)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      await service.removeThreadVote('nest-slug', 'thread-slug', 'actor-1')

      expect(threadVotesRepo.delete).toHaveBeenCalledWith('thread-1', 'actor-1', {})
      expect(threadsRepo.adjustScore).toHaveBeenCalledWith('thread-1', -1, 'nest-1', 'actor-1', {})
    })
  })

  describe('saveThread', () => {
    it('marks the thread as saved for the viewer', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', viewerSaved: false })

      nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      await service.saveThread('nest-slug', 'thread-slug', 'actor-1')

      expect(threadsPolicy.assertCanSaveThread).toHaveBeenCalledWith(thread, 'actor-1')
      expect(savedThreadsRepo.upsert).toHaveBeenCalledWith('thread-1', 'actor-1')
      expect(threadAccess.getContext).toHaveBeenCalledWith(expect.objectContaining({ viewerSaved: true }), 'actor-1')
    })
  })

  describe('unsaveThread', () => {
    it('marks the thread as unsaved for the viewer', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1', viewerSaved: true })

      nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
      threadsRepo.getBySlug.mockResolvedValue(thread)
      threadAccess.getContext.mockResolvedValue(createThreadAccessContext())
      threadPresenter.toDetailView.mockResolvedValue({ id: 'view' } as any)

      await service.unsaveThread('nest-slug', 'thread-slug', 'actor-1')

      expect(savedThreadsRepo.delete).toHaveBeenCalledWith('thread-1', 'actor-1')
      expect(threadAccess.getContext).toHaveBeenCalledWith(expect.objectContaining({ viewerSaved: false }), 'actor-1')
    })
  })

  describe('listSavedThreads', () => {
    it('presents each item as a search-result view', async () => {
      const page = { items: [createThreadDetails()], meta: { nextCursor: null, hasMore: false } }
      threadsRepo.listSaved.mockResolvedValue(page)
      threadPresenter.toSearchResultView.mockResolvedValue({ id: 'result' } as any)

      const result = await service.listSavedThreads('actor-1', {} as any)

      expect(threadsRepo.listSaved).toHaveBeenCalledWith('actor-1', {})
      expect(result).toEqual({ items: [{ id: 'result' }], meta: page.meta })
    })
  })

  describe('listFeed', () => {
    it('presents each item as a search-result view', async () => {
      const page = { items: [createThreadDetails()], meta: { nextCursor: null, hasMore: false } }
      threadsRepo.listFeed.mockResolvedValue(page)
      threadPresenter.toSearchResultView.mockResolvedValue({ id: 'result' } as any)

      const result = await service.listFeed('actor-1', {} as any)

      expect(result).toEqual({ items: [{ id: 'result' }], meta: page.meta })
    })
  })

  describe('listByAuthor', () => {
    it('presents each item as a search-result view', async () => {
      const page = { items: [createThreadDetails()], meta: { nextCursor: null, hasMore: false } }
      threadsRepo.listByAuthor.mockResolvedValue(page)
      threadPresenter.toSearchResultView.mockResolvedValue({ id: 'result' } as any)

      const result = await service.listByAuthor('author-1', 'viewer-1', {} as any)

      expect(threadsRepo.listByAuthor).toHaveBeenCalledWith('author-1', 'viewer-1', {})
      expect(result).toEqual({ items: [{ id: 'result' }], meta: page.meta })
    })
  })

  describe('adjustCommentCount', () => {
    it('delegates directly to the repository', async () => {
      await service.adjustCommentCount('thread-1', 1)

      expect(threadsRepo.adjustCommentCount).toHaveBeenCalledWith('thread-1', 1, undefined)
    })
  })

  describe('updateLastCommentAt', () => {
    it('delegates directly to the repository', async () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      await service.updateLastCommentAt('thread-1', date)

      expect(threadsRepo.updateLastCommentAt).toHaveBeenCalledWith('thread-1', date, undefined)
    })
  })
})
