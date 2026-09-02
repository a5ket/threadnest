import { Injectable } from '@nestjs/common'
import { VoteType } from 'generated/prisma/enums'
import { PinoLogger } from 'nestjs-pino'
import { isAttachmentKeyOwnedBy } from 'src/attachment/attachment-key.util'
import { InvalidAttachmentKeyException } from 'src/attachment/exceptions/invalid-attachment-key.exception'
import { EventBus } from 'src/event/event-bus'
import { NestRepository } from 'src/nest/nest.repository'
import { Database } from 'src/prisma/types/database'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { StorageService } from 'src/storage/storage.service'
import { computeVoteScoreDelta } from 'src/common/vote-score'
import { AttachmentInputDto } from 'src/attachment/dto/attachment-input.dto'
import { ThreadCreateDto } from './dto/thread.create.dto'
import { ThreadQueryDto } from './dto/thread.query.dto'
import { ThreadSearchQueryDto } from './dto/thread-search.query.dto'
import { ThreadSavedQueryDto } from './dto/thread-saved.query.dto'
import { ThreadFeedQueryDto } from './dto/thread-feed.query.dto'
import { ThreadUpdateDto } from './dto/thread.update.dto'
import { ThreadAlreadyDeletedException } from './exceptions/thread-already-deleted.exception'
import { ThreadCreatedEvent } from './events/thread-created.event'
import { ThreadDeletedEvent } from './events/thread-deleted.event'
import { ThreadLockedEvent } from './events/thread-locked.event'
import { ThreadPinnedEvent } from './events/thread-pinned.event'
import { ThreadUnlockedEvent } from './events/thread-unlocked.event'
import { ThreadUnpinnedEvent } from './events/thread-unpinned.event'
import { ThreadUpdatedEvent } from './events/thread-updated.event'
import { ThreadAccess } from './thread.access'
import { ThreadPolicy } from './thread.policy'
import { ThreadPresenter } from './thread.presenter'
import { ThreadRepository } from './thread.repository'
import { ThreadVoteRepository } from './thread-vote.repository'
import { SavedThreadRepository } from './saved-thread.repository'
import { ThreadPolicySubject } from './types/thread.policy-subject'

@Injectable()
export class ThreadService {
  constructor(
    private readonly threadsRepo: ThreadRepository,
    private readonly threadVotesRepo: ThreadVoteRepository,
    private readonly savedThreadsRepo: SavedThreadRepository,
    private readonly nestsRepo: NestRepository,
    private readonly threadsPolicy: ThreadPolicy,
    private readonly transactionManager: TransactionManager,
    private readonly threadAccess: ThreadAccess,
    private readonly threadPresenter: ThreadPresenter,
    private readonly eventBus: EventBus,
    private readonly storage: StorageService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(ThreadService.name)
  }

  private assertOwnsAttachments(attachments: AttachmentInputDto[] | undefined, actorUserId: string) {
    if (attachments?.some((a) => !isAttachmentKeyOwnedBy(a.key, actorUserId))) {
      throw new InvalidAttachmentKeyException()
    }
  }

  async createThread(nestSlug: string, actorUserId: string, dto: ThreadCreateDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.threadsPolicy.assertCanCreateThread(nest.id, actorUserId)
    this.assertOwnsAttachments(dto.attachments, actorUserId)

    const thread = await this.transactionManager.run(async (tx) => {
      const thread = await this.threadsRepo.create(nest.id, actorUserId, dto, tx)

      await this.nestsRepo.adjustThreadCount(nest.id, 1, tx)

      return thread
    })

    void this.eventBus.publish(new ThreadCreatedEvent({
      threadId: thread.id,
      nestId: thread.nestId,
      authorId: thread.authorId,
      slug: thread.slug,
      title: thread.title,
    }))

    const threadCtx = await this.threadAccess.getContext(thread, actorUserId)

    return this.threadPresenter.toDetailView(thread, threadCtx)
  }

  async getThread(nestSlug: string, threadSlug: string, actorUserId?: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)
    const threadCtx = await this.threadsPolicy.assertCanReadThread(thread, actorUserId)

    return this.threadPresenter.toDetailView(thread, threadCtx)
  }

  async getById(threadId: string) {
    return this.threadsRepo.getById(threadId)
  }

  async getByNestSlug(nestSlug: string, threadSlug: string, actorUserId?: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)
    return this.threadsRepo.getBySlug(nest.id, threadSlug, actorUserId)
  }

  async listByNest(nestSlug: string, query: ThreadQueryDto, actorUserId?: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.threadsPolicy.assertCanReadThreads(nest.id, actorUserId)

    const page = await this.threadsRepo.listByNest(nest.id, query, actorUserId)

    return { items: await Promise.all(page.items.map((t) => this.threadPresenter.toSummaryView(t))), meta: page.meta }
  }

  async searchThreads(query: ThreadSearchQueryDto, actorUserId?: string) {
    const page = await this.threadsRepo.searchGlobal(query.search, query.limit, query.cursor, actorUserId)

    return { items: await Promise.all(page.items.map((t) => this.threadPresenter.toSearchResultView(t))), meta: page.meta }
  }

  async discoverFeed(query: ThreadFeedQueryDto, actorUserId?: string) {
    const page = await this.threadsRepo.listDiscoverFeed(query, actorUserId)

    return { items: await Promise.all(page.items.map((t) => this.threadPresenter.toSearchResultView(t))), meta: page.meta }
  }

  async updateThread(nestSlug: string, threadSlug: string, actorUserId: string, dto: ThreadUpdateDto) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanUpdateThread(thread, actorUserId)
    this.assertOwnsAttachments(dto.attachments, actorUserId)

    const { thread: updated, droppedAttachmentKeys } = await this.threadsRepo.updateById(thread.id, thread.nestId, dto, actorUserId)

    await Promise.all(droppedAttachmentKeys.map((key) => this.storage.delete(key)))

    void this.eventBus.publish(new ThreadUpdatedEvent({
      threadId: updated.id,
      nestId: updated.nestId,
      userId: actorUserId,
      title: updated.title,
    }))

    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async deleteThread(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanDeleteThread(thread, actorUserId)

    await this.softDeleteAndNotify(thread, actorUserId, false)
  }

  // Bypasses nest-level membership/permission checks: platform authority supersedes them.
  async removeByPlatform(threadId: string, actorUserId: string) {
    const thread = await this.threadsRepo.getById(threadId)

    if (thread.deletedAt) {
      throw new ThreadAlreadyDeletedException()
    }

    await this.softDeleteAndNotify(thread, actorUserId, true)

    return thread
  }

  // Bulk moderation sweep: intentionally skips per-thread events, unlike removeByPlatform — one
  // notification per removed thread would spam whoever's being purged for a handful of comments.
  async removeAllByAuthorPlatform(authorId: string, actorUserId: string) {
    const threads = await this.threadsRepo.listActiveByAuthor(authorId)

    if (threads.length === 0) {
      return 0
    }

    await this.transactionManager.run(async (tx) => {
      await this.threadsRepo.softDeleteManyByAuthor(authorId, actorUserId, tx)

      const countsByNest = new Map<string, number>()
      for (const thread of threads) {
        countsByNest.set(thread.nestId, (countsByNest.get(thread.nestId) ?? 0) + 1)
      }

      for (const [nestId, count] of countsByNest) {
        await this.nestsRepo.adjustThreadCount(nestId, -count, tx)
      }
    })

    return threads.length
  }

  private async softDeleteAndNotify(thread: ThreadPolicySubject, actorUserId: string, deletedByPlatform: boolean) {
    await this.transactionManager.run(async (tx) => {
      await this.threadsRepo.softDelete(thread.id, actorUserId, tx, deletedByPlatform)
      await this.nestsRepo.adjustThreadCount(thread.nestId, -1, tx)
    })

    // Platform removals are already logged one layer up, in PlatformContentService.
    if (!deletedByPlatform && thread.authorId !== actorUserId) {
      this.logger.info({ threadId: thread.id, actorUserId, authorId: thread.authorId }, 'Nest moderator removed thread')
    }

    void this.eventBus.publish(new ThreadDeletedEvent({
      threadId: thread.id,
      title: thread.title,
      slug: thread.slug,
      nestId: thread.nestId,
      nestSlug: thread.nest.slug,
      nestName: thread.nest.name,
      authorId: thread.authorId,
      deletedById: actorUserId,
      recipientId: thread.authorId === actorUserId ? null : thread.authorId,
    }))
  }

  async lockThread(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanManageThreadLock(thread, actorUserId)

    const updated = await this.threadsRepo.lock(thread.id, thread.nestId, actorUserId)

    this.logger.info({ threadId: thread.id, actorUserId }, 'Thread locked')
    void this.eventBus.publish(new ThreadLockedEvent({
      threadId: updated.id,
      nestId: updated.nestId,
      userId: actorUserId,
    }))

    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async unlockThread(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanManageThreadLock(thread, actorUserId)

    const updated = await this.threadsRepo.unlock(thread.id, thread.nestId, actorUserId)

    this.logger.info({ threadId: thread.id, actorUserId }, 'Thread unlocked')
    void this.eventBus.publish(new ThreadUnlockedEvent({
      threadId: updated.id,
      nestId: updated.nestId,
      userId: actorUserId,
    }))

    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async pinThread(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanManageThreadPin(thread, actorUserId)

    const updated = await this.threadsRepo.pin(thread.id, thread.nestId, actorUserId)

    this.logger.info({ threadId: thread.id, actorUserId }, 'Thread pinned')
    void this.eventBus.publish(new ThreadPinnedEvent({
      threadId: updated.id,
      nestId: updated.nestId,
      userId: actorUserId,
    }))

    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async unpinThread(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanManageThreadPin(thread, actorUserId)

    const updated = await this.threadsRepo.unpin(thread.id, thread.nestId, actorUserId)

    this.logger.info({ threadId: thread.id, actorUserId }, 'Thread unpinned')
    void this.eventBus.publish(new ThreadUnpinnedEvent({
      threadId: updated.id,
      nestId: updated.nestId,
      userId: actorUserId,
    }))

    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async voteOnThread(nestSlug: string, threadSlug: string, actorUserId: string, type: VoteType) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanVoteThread(thread, actorUserId)

    const updated = await this.transactionManager.run(async (tx) => {
      const current = await this.threadVotesRepo.find(thread.id, actorUserId, tx)
      const delta = computeVoteScoreDelta(current?.type ?? null, type)
      await this.threadVotesRepo.upsert(thread.id, actorUserId, type, tx)
      return this.threadsRepo.adjustScore(thread.id, delta, thread.nestId, actorUserId, tx)
    })

    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async removeThreadVote(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanVoteThread(thread, actorUserId)

    const updated = await this.transactionManager.run(async (tx) => {
      const current = await this.threadVotesRepo.find(thread.id, actorUserId, tx)
      const delta = computeVoteScoreDelta(current?.type ?? null, null)
      await this.threadVotesRepo.delete(thread.id, actorUserId, tx)
      return this.threadsRepo.adjustScore(thread.id, delta, thread.nestId, actorUserId, tx)
    })

    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async saveThread(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanSaveThread(thread, actorUserId)

    await this.savedThreadsRepo.upsert(thread.id, actorUserId)

    const updated = { ...thread, viewerSaved: true }
    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async unsaveThread(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanSaveThread(thread, actorUserId)

    await this.savedThreadsRepo.delete(thread.id, actorUserId)

    const updated = { ...thread, viewerSaved: false }
    const threadCtx = await this.threadAccess.getContext(updated, actorUserId)

    return this.threadPresenter.toDetailView(updated, threadCtx)
  }

  async listSavedThreads(actorUserId: string, query: ThreadSavedQueryDto) {
    const page = await this.threadsRepo.listSaved(actorUserId, query)

    return { items: await Promise.all(page.items.map((t) => this.threadPresenter.toSearchResultView(t))), meta: page.meta }
  }

  async listFeed(actorUserId: string, query: ThreadFeedQueryDto) {
    const page = await this.threadsRepo.listFeed(actorUserId, query)

    return { items: await Promise.all(page.items.map((t) => this.threadPresenter.toSearchResultView(t))), meta: page.meta }
  }

  async listByAuthor(authorId: string, viewerId: string | undefined, query: ThreadFeedQueryDto) {
    const page = await this.threadsRepo.listByAuthor(authorId, viewerId, query)

    return { items: await Promise.all(page.items.map((t) => this.threadPresenter.toSearchResultView(t))), meta: page.meta }
  }

  async adjustCommentCount(threadId: string, delta: number, db?: Database) {
    return this.threadsRepo.adjustCommentCount(threadId, delta, db)
  }

  async updateLastCommentAt(threadId: string, date: Date, db?: Database) {
    return this.threadsRepo.updateLastCommentAt(threadId, date, db)
  }
}
