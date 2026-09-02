import { Injectable } from '@nestjs/common'
import { VoteType } from 'generated/prisma/enums'
import { PinoLogger } from 'nestjs-pino'
import { isAttachmentKeyOwnedBy } from 'src/attachment/attachment-key.util'
import { InvalidAttachmentKeyException } from 'src/attachment/exceptions/invalid-attachment-key.exception'
import { BlockService } from 'src/block/block.service'
import { computeVoteScoreDelta } from 'src/common/vote-score'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { ThreadAccess } from 'src/thread/thread.access'
import { ThreadService } from 'src/thread/thread.service'
import { CommentPolicy } from './comment.policy'
import { CommentPresenter } from './comment.presenter'
import { CommentRepository } from './comment.repository'
import { CommentVoteRepository } from './comment-vote.repository'
import { CommentAuthorQueryDto } from './dto/comment-author.query.dto'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentUpdateDto } from './dto/comment.update.dto'
import { CommentAlreadyDeletedException } from './exceptions/comment-already-deleted.exception'
import { CommentCreatedEvent } from './events/comment-created.event'
import { CommentDeletedEvent } from './events/comment-deleted.event'
import { CommentUpdatedEvent } from './events/comment-updated.event'
import { Comment, CommentBlockFlags, CommentTreeOptions } from './types/comment'
import { ThreadPolicySubject } from 'src/thread/types/thread.policy-subject'

/** Comment lifecycle: creation (root + replies), edits, moderation, voting, and listing. */
@Injectable()
export class CommentService {
  constructor(
    private readonly repo: CommentRepository,
    private readonly commentVotesRepo: CommentVoteRepository,
    private readonly threads: ThreadService,
    private readonly threadAccess: ThreadAccess,
    private readonly commentPolicy: CommentPolicy,
    private readonly commentPresenter: CommentPresenter,
    private readonly transactionManager: TransactionManager,
    private readonly blocks: BlockService,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(CommentService.name)
  }

  /** @throws {InvalidAttachmentKeyException} The attachment key isn't namespaced under `actorUserId`'s own uploads. */
  private assertOwnsAttachment(dto: CommentCreateDto, actorUserId: string) {
    if (dto.attachment && !isAttachmentKeyOwnedBy(dto.attachment.key, actorUserId)) {
      throw new InvalidAttachmentKeyException()
    }
  }

  /**
   * The full comment tree for a thread's top-level comment page.
   *
   * @param nestSlug - The nest the thread belongs to.
   * @param threadSlug - The thread whose comments to list.
   * @param viewerId - The viewer, or null if anonymous.
   * @param options - Sort/depth/pagination for the tree query.
   */
  async listCommentsByThreadSlug(nestSlug: string, threadSlug: string, viewerId: string | null, options: CommentTreeOptions) {
    const thread = await this.threads.getByNestSlug(nestSlug, threadSlug)
    const threadCtx = await this.threadAccess.getContext(thread, viewerId ?? undefined)

    this.commentPolicy.assertCanReadThreadComment(threadCtx)

    const page = await this.repo.getByThread(thread.id, thread.nestId, viewerId, options)

    return this.commentPresenter.toTreePage(page, threadCtx.canModerateContent)
  }

  /**
   * The reply subtree under one comment — used for "load more replies" pagination beneath the
   * initial tree page.
   *
   * @param commentId - The parent comment whose replies to list.
   * @param viewerId - The viewer, or null if anonymous.
   * @param options - Sort/depth/pagination for the tree query.
   */
  async listCommentReplies(commentId: string, viewerId: string | null, options: CommentTreeOptions) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, viewerId ?? undefined)

    this.commentPolicy.assertCanReadThreadComment(threadCtx)

    const page = await this.repo.getReplies(comment.id, thread.nestId, viewerId, options)

    return this.commentPresenter.toTreePage(page, threadCtx.canModerateContent)
  }

  /**
   * Creates a top-level (non-reply) comment. `recipientId` on the resulting notification is null
   * when commenting on your own thread, so you don't get notified of your own activity.
   *
   * @param nestSlug - The nest the thread belongs to.
   * @param threadSlug - The thread to comment on.
   * @param userId - The comment's author.
   * @param dto - Content and optional attachment.
   * @throws {InvalidAttachmentKeyException} See {@link assertOwnsAttachment}.
   */
  async createThreadCommentByThreadSlug(
    nestSlug: string,
    threadSlug: string,
    userId: string,
    dto: CommentCreateDto
  ) {
    const thread = await this.threads.getByNestSlug(nestSlug, threadSlug)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    this.commentPolicy.assertCanCreateThreadComment(threadCtx)
    this.assertOwnsAttachment(dto, userId)

    const comment = await this.transactionManager.run(async (tx) => {
      const created = await this.repo.create(thread.id, userId, thread.nestId, dto, tx)
      await this.threads.adjustCommentCount(thread.id, 1, tx)
      await this.threads.updateLastCommentAt(thread.id, created.createdAt, tx)
      return created
    })

    void this.eventBus.publish(new CommentCreatedEvent({
      commentId: comment.id,
      content: dto.content,
      authorId: userId,
      parentCommentId: null,
      recipientId: thread.authorId === userId ? null : thread.authorId,
      threadId: thread.id,
      threadSlug: thread.slug,
      threadTitle: thread.title,
      nestId: thread.nestId,
      nestSlug: thread.nest.slug,
      nestName: thread.nest.name,
    }))
    return this.commentPresenter.toView(comment, await this.getBlockFlags(userId, comment.author.id), threadCtx.canModerateContent)
  }

  /**
   * Replies to an existing comment. `recipientId` is null when replying to your own comment.
   *
   * @param commentId - The comment being replied to.
   * @param userId - The reply's author.
   * @param dto - Content and optional attachment.
   * @throws {InvalidAttachmentKeyException} See {@link assertOwnsAttachment}.
   */
  async createCommentReply(
    commentId: string,
    userId: string,
    dto: CommentCreateDto
  ) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    this.commentPolicy.assertCanReplyToComment(comment, threadCtx)
    this.assertOwnsAttachment(dto, userId)

    const reply = await this.transactionManager.run(async (tx) => {
      const created = await this.repo.createReply(comment, userId, thread.nestId, dto, tx)
      await this.threads.adjustCommentCount(thread.id, 1, tx)
      await this.threads.updateLastCommentAt(thread.id, created.createdAt, tx)
      return created
    })

    void this.eventBus.publish(new CommentCreatedEvent({
      commentId: reply.id,
      content: dto.content,
      authorId: userId,
      parentCommentId: comment.id,
      recipientId: comment.author.id === userId ? null : comment.author.id,
      threadId: thread.id,
      threadSlug: thread.slug,
      threadTitle: thread.title,
      nestId: thread.nestId,
      nestSlug: thread.nest.slug,
      nestName: thread.nest.name,
    }))
    return this.commentPresenter.toView(reply, await this.getBlockFlags(userId, reply.author.id), threadCtx.canModerateContent)
  }

  /** @param viewerId - The viewer, or null if anonymous. */
  async getCommentById(commentId: string, viewerId: string | null) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, viewerId ?? undefined)

    this.commentPolicy.assertCanReadThreadComment(threadCtx)

    // nestId/viewerId aren't known until the thread lookup above, so re-fetch with the full viewer select.
    const commentWithRole = await this.repo.getByIdForViewer(commentId, thread.nestId, viewerId ?? undefined)

    return this.commentPresenter.toView(commentWithRole, await this.getBlockFlags(viewerId, comment.author.id), threadCtx.canModerateContent)
  }

  /**
   * @param commentId - The comment to update.
   * @param userId - Must be the comment's author.
   * @param dto - The new content.
   */
  async updateComment(
    commentId: string,
    userId: string,
    dto: CommentUpdateDto
  ) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    this.commentPolicy.assertCanUpdateComment(comment, userId, threadCtx)

    const updated = await this.repo.updateById(comment.id, thread.nestId, dto, userId)
    void this.eventBus.publish(new CommentUpdatedEvent({ commentId: comment.id, threadId: comment.threadId, authorId: comment.author.id }))
    return this.commentPresenter.toView(updated, await this.getBlockFlags(userId, updated.author.id), threadCtx.canModerateContent)
  }

  /** By the author or a nest moderator — see {@link removeByPlatform} for platform-level removal. */
  async removeComment(
    commentId: string,
    userId: string
  ) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)

    await this.commentPolicy.assertCanDeleteComment(comment, userId)

    await this.softDeleteAndNotify(comment, thread, userId, false)
  }

  /**
   * Platform-admin removal — bypasses nest-level membership/permission checks entirely, since
   * platform authority supersedes them.
   *
   * @param commentId - The comment to remove.
   * @param actorUserId - The platform admin performing the removal.
   * @throws {CommentAlreadyDeletedException} Already deleted.
   */
  async removeByPlatform(commentId: string, actorUserId: string) {
    const comment = await this.repo.getById(commentId)

    if (comment.deletedAt) {
      throw new CommentAlreadyDeletedException()
    }

    const thread = await this.threads.getById(comment.threadId)

    await this.softDeleteAndNotify(comment, thread, actorUserId, true)

    return { comment, thread }
  }

  /**
   * Bulk moderation sweep, e.g. when a user is banned platform-wide. Intentionally skips
   * per-comment events, unlike {@link removeByPlatform} — one notification per removed comment
   * would spam whoever's being purged for a large number of comments.
   *
   * @param authorId - Every active comment by this author is removed.
   * @param actorUserId - The platform admin performing the sweep.
   * @returns The number of comments removed.
   */
  async removeAllByAuthorPlatform(authorId: string, actorUserId: string) {
    const comments = await this.repo.listActiveByAuthor(authorId)

    if (comments.length === 0) {
      return 0
    }

    const countsByThread = new Map<string, number>()
    for (const comment of comments) {
      countsByThread.set(comment.threadId, (countsByThread.get(comment.threadId) ?? 0) + 1)
    }

    await this.transactionManager.run(async (tx) => {
      await this.repo.softDeleteManyByAuthor(authorId, actorUserId, tx)

      for (const comment of comments) {
        await this.repo.decrementReplyCount(comment.parentId, tx)
      }

      for (const [threadId, count] of countsByThread) {
        await this.threads.adjustCommentCount(threadId, -count, tx)

        const [latest, thread] = await Promise.all([
          this.repo.getLatestCommentByThreadId(threadId, tx),
          this.threads.getById(threadId),
        ])
        await this.threads.updateLastCommentAt(threadId, latest?.createdAt ?? thread.createdAt, tx)
      }
    })

    return comments.length
  }

  /**
   * @param deletedByPlatform - Suppresses the "moderator removed" log line, since platform
   *   removals are logged one layer up in `PlatformContentService`.
   */
  private async softDeleteAndNotify(comment: Comment, thread: ThreadPolicySubject, actorUserId: string, deletedByPlatform: boolean) {
    await this.transactionManager.run(async (tx) => {
      await this.repo.softDeleteById(comment.id, actorUserId, tx, deletedByPlatform)
      await this.repo.decrementReplyCount(comment.parentId, tx)
      await this.threads.adjustCommentCount(thread.id, -1, tx)
      const latest = await this.repo.getLatestCommentByThreadId(thread.id, tx)
      await this.threads.updateLastCommentAt(thread.id, latest?.createdAt ?? thread.createdAt, tx)
    })

    // Platform removals are already logged one layer up, in PlatformContentService.
    if (!deletedByPlatform && comment.author.id !== actorUserId) {
      this.logger.info({ commentId: comment.id, actorUserId, authorId: comment.author.id }, 'Nest moderator removed comment')
    }

    void this.eventBus.publish(new CommentDeletedEvent({
      commentId: comment.id,
      content: comment.content,
      authorId: comment.author.id,
      deletedById: actorUserId,
      recipientId: comment.author.id === actorUserId ? null : comment.author.id,
      threadId: thread.id,
      threadSlug: thread.slug,
      threadTitle: thread.title,
      nestId: thread.nestId,
      nestSlug: thread.nest.slug,
      nestName: thread.nest.name,
    }))
  }

  /** Upserts the viewer's vote and adjusts the comment's score by the resulting delta. */
  async voteOnComment(commentId: string, userId: string, type: VoteType) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    this.commentPolicy.assertCanVoteOnComment(comment, threadCtx)

    const updated = await this.transactionManager.run(async (tx) => {
      const current = await this.commentVotesRepo.find(commentId, userId, tx)
      const delta = computeVoteScoreDelta(current?.type ?? null, type)
      await this.commentVotesRepo.upsert(commentId, userId, type, tx)
      return this.repo.adjustScore(commentId, delta, thread.nestId, userId, tx)
    })

    return this.commentPresenter.toView(updated, await this.getBlockFlags(userId, updated.author.id), threadCtx.canModerateContent)
  }

  /** Removes the viewer's vote and reverses its effect on the comment's score. */
  async removeCommentVote(commentId: string, userId: string) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    this.commentPolicy.assertCanVoteOnComment(comment, threadCtx)

    const updated = await this.transactionManager.run(async (tx) => {
      const current = await this.commentVotesRepo.find(commentId, userId, tx)
      const delta = computeVoteScoreDelta(current?.type ?? null, null)
      await this.commentVotesRepo.delete(commentId, userId, tx)
      return this.repo.adjustScore(commentId, delta, thread.nestId, userId, tx)
    })

    return this.commentPresenter.toView(updated, await this.getBlockFlags(userId, updated.author.id), threadCtx.canModerateContent)
  }

  /**
   * @param authorId - Lists this user's comments.
   * @param viewerId - The viewer, if signed in; gates which of `authorId`'s private-nest comments show.
   */
  async listByAuthor(authorId: string, viewerId: string | undefined, query: CommentAuthorQueryDto) {
    const page = await this.repo.listByAuthor(authorId, viewerId, query)

    return { items: await Promise.all(page.items.map((item) => this.commentPresenter.toAuthorItemView(item))), meta: page.meta }
  }

  /** @param viewerId - Returns both-false without querying if anonymous — an anonymous viewer can't have blocked anyone. */
  private async getBlockFlags(viewerId: string | null, authorId: string): Promise<CommentBlockFlags> {
    if (!viewerId) {
      return { viewerBlockedAuthor: false, authorBlockedViewer: false }
    }

    const [viewerBlockedAuthor, authorBlockedViewer] = await Promise.all([
      this.blocks.exists(viewerId, authorId),
      this.blocks.exists(authorId, viewerId)
    ])

    return { viewerBlockedAuthor, authorBlockedViewer }
  }
}
