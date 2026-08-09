import { Injectable } from '@nestjs/common'
import { VoteType } from 'generated/prisma/enums'
import { EventBus } from 'src/event/event-bus'
import { NestRepository } from 'src/nest/nest.repository'
import { Database } from 'src/prisma/types/database'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { computeVoteScoreDelta } from 'src/common/vote-score'
import { ThreadCreateDto } from './dto/thread.create.dto'
import { ThreadQueryDto } from './dto/thread.query.dto'
import { ThreadUpdateDto } from './dto/thread.update.dto'
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

@Injectable()
export class ThreadService {
  constructor(
    private readonly threadsRepo: ThreadRepository,
    private readonly threadVotesRepo: ThreadVoteRepository,
    private readonly nestsRepo: NestRepository,
    private readonly threadsPolicy: ThreadPolicy,
    private readonly transactionManager: TransactionManager,
    private readonly threadAccess: ThreadAccess,
    private readonly threadPresenter: ThreadPresenter,
    private readonly eventBus: EventBus
  ) { }

  async createThread(nestSlug: string, actorUserId: string, dto: ThreadCreateDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.threadsPolicy.assertCanCreateThread(nest.id, actorUserId)

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
    const threadCtx = await this.threadAccess.getContext(thread, actorUserId)

    await this.threadsPolicy.assertCanReadThread(threadCtx)

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

    return { items: page.items.map((t) => this.threadPresenter.toSummaryView(t)), meta: page.meta }
  }

  async updateThread(nestSlug: string, threadSlug: string, actorUserId: string, dto: ThreadUpdateDto) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanUpdateThread(thread, actorUserId)

    const updated = await this.threadsRepo.updateById(thread.id, thread.nestId, dto, actorUserId)

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

    await this.transactionManager.run(async (tx) => {
      await this.threadsRepo.softDelete(thread.id, actorUserId, tx)
      await this.nestsRepo.adjustThreadCount(thread.nestId, -1, tx)
    })

    void this.eventBus.publish(new ThreadDeletedEvent({
      threadId: thread.id,
      nestId: thread.nestId,
      userId: actorUserId,
    }))
  }

  async lockThread(nestSlug: string, threadSlug: string, actorUserId: string) {
    const thread = await this.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanManageThreadLock(thread, actorUserId)

    const updated = await this.threadsRepo.lock(thread.id, thread.nestId, actorUserId)

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

  async adjustCommentCount(threadId: string, delta: number, db?: Database) {
    return this.threadsRepo.adjustCommentCount(threadId, delta, db)
  }

  async updateLastCommentAt(threadId: string, date: Date, db?: Database) {
    return this.threadsRepo.updateLastCommentAt(threadId, date, db)
  }
}
