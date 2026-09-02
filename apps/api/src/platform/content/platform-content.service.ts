import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { CommentService } from 'src/comment/comment.service'
import { EventBus } from 'src/event/event-bus'
import { ThreadService } from 'src/thread/thread.service'
import { PlatformCommentRemovedEvent } from '../events/platform-comment-removed.event'
import { PlatformContentBulkRemovedEvent } from '../events/platform-content-bulk-removed.event'
import { PlatformThreadRemovedEvent } from '../events/platform-thread-removed.event'
import { PlatformContentPolicy } from './platform-content.policy'

@Injectable()
export class PlatformContentService {
  constructor(
    private readonly policy: PlatformContentPolicy,
    private readonly threads: ThreadService,
    private readonly comments: CommentService,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(PlatformContentService.name)
  }

  /**
   * Removes a thread with platform-moderator authority, bypassing nest-level permission checks.
   * Publishes {@link PlatformThreadRemovedEvent} for downstream notification/action-log consumers.
   *
   * @param threadId - The thread to remove.
   * @param actorUserId - The platform moderator performing the removal.
   * @throws {InsufficientPermissionsException} Not a platform moderator or admin.
   * @throws {ThreadNotFoundException} No thread with this id.
   * @throws {ThreadAlreadyDeletedException} Already deleted.
   */
  async removeThread(threadId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    const thread = await this.threads.removeByPlatform(threadId, actorUserId)

    this.logger.info({ threadId: thread.id, actorUserId, authorId: thread.authorId }, 'Platform removed thread')
    void this.eventBus.publish(new PlatformThreadRemovedEvent({
      threadId: thread.id,
      threadSlug: thread.slug,
      threadTitle: thread.title,
      nestId: thread.nestId,
      nestSlug: thread.nest.slug,
      nestName: thread.nest.name,
      authorId: thread.authorId,
      removedById: actorUserId,
    }))
  }

  /**
   * Removes a comment with platform-moderator authority, bypassing nest-level permission checks.
   * Publishes {@link PlatformCommentRemovedEvent} with a truncated 200-char excerpt of the
   * removed content, for downstream notification/action-log consumers.
   *
   * @param commentId - The comment to remove.
   * @param actorUserId - The platform moderator performing the removal.
   * @throws {InsufficientPermissionsException} Not a platform moderator or admin.
   * @throws {CommentNotFoundException} No comment with this id.
   * @throws {CommentAlreadyDeletedException} Already deleted.
   */
  async removeComment(commentId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    const { comment, thread } = await this.comments.removeByPlatform(commentId, actorUserId)

    this.logger.info({ commentId: comment.id, actorUserId, authorId: comment.authorId }, 'Platform removed comment')
    void this.eventBus.publish(new PlatformCommentRemovedEvent({
      commentId: comment.id,
      commentExcerpt: comment.content.slice(0, 200),
      threadSlug: thread.slug,
      threadTitle: thread.title,
      nestId: thread.nestId,
      nestSlug: thread.nest.slug,
      nestName: thread.nest.name,
      authorId: comment.authorId,
      removedById: actorUserId,
    }))
  }

  /**
   * Bulk-removes every thread and comment authored by a user, with platform-moderator authority —
   * used when purging a suspended/banned user's content platform-wide. Publishes
   * {@link PlatformContentBulkRemovedEvent} only if anything was actually removed, so purging an
   * already-clean user is a silent no-op that doesn't spam downstream consumers.
   *
   * @param userId - The author whose content to remove.
   * @param actorUserId - The platform moderator performing the removal.
   * @returns Counts of threads and comments removed.
   * @throws {InsufficientPermissionsException} Not a platform moderator or admin.
   */
  async removeAllContentByUser(userId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    const threadsRemoved = await this.threads.removeAllByAuthorPlatform(userId, actorUserId)
    const commentsRemoved = await this.comments.removeAllByAuthorPlatform(userId, actorUserId)

    if (threadsRemoved > 0 || commentsRemoved > 0) {
      this.logger.info({ userId, actorUserId, threadsRemoved, commentsRemoved }, 'Platform bulk-removed user content')
      void this.eventBus.publish(new PlatformContentBulkRemovedEvent({
        userId,
        threadsRemoved,
        commentsRemoved,
        removedById: actorUserId,
      }))
    }

    return { threadsRemoved, commentsRemoved }
  }
}
