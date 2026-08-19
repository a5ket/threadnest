import { Injectable } from '@nestjs/common'
import { CommentService } from 'src/comment/comment.service'
import { ThreadService } from 'src/thread/thread.service'
import { PlatformContentPolicy } from './platform-content.policy'

@Injectable()
export class PlatformContentService {
  constructor(
    private readonly policy: PlatformContentPolicy,
    private readonly threads: ThreadService,
    private readonly comments: CommentService,
  ) { }

  async removeThread(threadId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    await this.threads.removeByPlatform(threadId, actorUserId)
  }

  async removeComment(commentId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    await this.comments.removeByPlatform(commentId, actorUserId)
  }

  async removeAllContentByUser(userId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    const threadsRemoved = await this.threads.removeAllByAuthorPlatform(userId, actorUserId)
    const commentsRemoved = await this.comments.removeAllByAuthorPlatform(userId, actorUserId)

    return { threadsRemoved, commentsRemoved }
  }
}
