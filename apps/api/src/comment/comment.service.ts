import { Injectable } from '@nestjs/common'
import { BlockService } from 'src/block/block.service'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { ThreadAccess } from 'src/thread/thread.access'
import { ThreadService } from 'src/thread/thread.service'
import { CommentPolicy } from './comment.policy'
import { CommentPresenter } from './comment.presenter'
import { CommentRepository } from './comment.repository'
import { CommentCreateDto } from './dto/comment.create.dto'
import { CommentUpdateDto } from './dto/comment.update.dto'
import { CommentCreatedEvent } from './events/comment-created.event'
import { CommentDeletedEvent } from './events/comment-deleted.event'
import { CommentUpdatedEvent } from './events/comment-updated.event'
import { CommentBlockFlags, CommentTreeOptions } from './types/comment'

@Injectable()
export class CommentService {
  constructor(
    private readonly repo: CommentRepository,
    private readonly threads: ThreadService,
    private readonly threadAccess: ThreadAccess,
    private readonly commentPolicy: CommentPolicy,
    private readonly commentPresenter: CommentPresenter,
    private readonly transactionManager: TransactionManager,
    private readonly blocks: BlockService,
    private readonly eventBus: EventBus
  ) { }

  async listCommentsByThreadSlug(nestSlug: string, threadSlug: string, viewerId: string | null, options: CommentTreeOptions) {
    const thread = await this.threads.getByNestSlug(nestSlug, threadSlug)
    const threadCtx = await this.threadAccess.getContext(thread, viewerId ?? undefined)

    this.commentPolicy.assertCanReadThreadComment(threadCtx)

    const page = await this.repo.getByThread(thread.id, viewerId, options)

    return this.commentPresenter.toTreePage(page, threadCtx.canModerateContent)
  }

  async listCommentReplies(commentId: string, viewerId: string | null, options: CommentTreeOptions) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, viewerId ?? undefined)

    this.commentPolicy.assertCanReadThreadComment(threadCtx)

    const page = await this.repo.getReplies(comment.id, viewerId, options)

    return this.commentPresenter.toTreePage(page, threadCtx.canModerateContent)
  }

  async createThreadCommentByThreadSlug(
    nestSlug: string,
    threadSlug: string,
    userId: string,
    dto: CommentCreateDto
  ) {
    const thread = await this.threads.getByNestSlug(nestSlug, threadSlug)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    this.commentPolicy.assertCanCreateThreadComment(threadCtx)

    const comment = await this.transactionManager.run(async (tx) => {
      const created = await this.repo.create(thread.id, userId, dto, tx)
      await this.threads.adjustCommentCount(thread.id, 1, tx)
      await this.threads.updateLastCommentAt(thread.id, created.createdAt, tx)
      return created
    })

    void this.eventBus.publish(new CommentCreatedEvent({ commentId: comment.id, threadId: thread.id, authorId: userId, parentCommentId: null }))
    return this.commentPresenter.toView(comment, await this.getBlockFlags(userId, comment.author.id), threadCtx.canModerateContent)
  }

  async createCommentReply(
    commentId: string,
    userId: string,
    dto: CommentCreateDto
  ) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    this.commentPolicy.assertCanReplyToComment(comment, threadCtx)

    const reply = await this.transactionManager.run(async (tx) => {
      const created = await this.repo.createReply(comment, userId, dto, tx)
      await this.threads.adjustCommentCount(thread.id, 1, tx)
      await this.threads.updateLastCommentAt(thread.id, created.createdAt, tx)
      return created
    })

    void this.eventBus.publish(new CommentCreatedEvent({ commentId: reply.id, threadId: comment.threadId, authorId: userId, parentCommentId: comment.id }))
    return this.commentPresenter.toView(reply, await this.getBlockFlags(userId, reply.author.id), threadCtx.canModerateContent)
  }

  async getCommentById(commentId: string, viewerId: string | null) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, viewerId ?? undefined)

    this.commentPolicy.assertCanReadThreadComment(threadCtx)

    return this.commentPresenter.toView(comment, await this.getBlockFlags(viewerId, comment.author.id), threadCtx.canModerateContent)
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: CommentUpdateDto
  ) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    this.commentPolicy.assertCanUpdateComment(comment, userId, threadCtx)

    const updated = await this.repo.updateById(comment.id, dto)
    void this.eventBus.publish(new CommentUpdatedEvent({ commentId: comment.id, threadId: comment.threadId, authorId: comment.author.id }))
    return this.commentPresenter.toView(updated, await this.getBlockFlags(userId, updated.author.id), threadCtx.canModerateContent)
  }

  async removeComment(
    commentId: string,
    userId: string
  ) {
    const comment = await this.repo.getById(commentId)
    const thread = await this.threads.getById(comment.threadId)

    await this.commentPolicy.assertCanDeleteComment(comment, userId)

    await this.transactionManager.run(async (tx) => {
      await this.repo.softDeleteById(comment.id, userId, tx)
      await this.repo.decrementReplyCount(comment.parentId, tx)
      await this.threads.adjustCommentCount(thread.id, -1, tx)
      const latest = await this.repo.getLatestCommentByThreadId(thread.id, tx)
      await this.threads.updateLastCommentAt(thread.id, latest?.createdAt ?? thread.createdAt, tx)
    })

    void this.eventBus.publish(new CommentDeletedEvent({ commentId: comment.id, threadId: comment.threadId, deletedById: userId }))
  }

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
