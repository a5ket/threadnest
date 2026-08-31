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
