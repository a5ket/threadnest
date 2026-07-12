import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { ThreadAccess } from 'src/thread/thread.access'
import { ThreadAccessContext } from 'src/thread/types/thread.access-context'
import { ThreadRepository } from 'src/thread/thread.repository'
import { CommentPolicySubject } from './types/comment.policy-subject'

@Injectable()
export class CommentPolicy {
  constructor(
    private readonly threadAccess: ThreadAccess,
    private readonly threadsRepo: ThreadRepository,
  ) { }

  assertCanCreateThreadComment(threadCtx: ThreadAccessContext) {
    if (!threadCtx.canCommentThread) {
      throw new InsufficientPermissionsException()
    }
  }

  assertCanReadThreadComment(threadCtx: ThreadAccessContext) {
    if (!threadCtx.canViewThread) {
      throw new ThreadNotFoundException()
    }
  }

  assertCanUpdateComment(comment: CommentPolicySubject, userId: string, threadCtx: ThreadAccessContext) {
    if (comment.deletedAt || !threadCtx.canViewThread || comment.authorId !== userId) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanDeleteComment(comment: CommentPolicySubject, userId: string) {
    const thread = await this.threadsRepo.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    if (comment.deletedAt || !threadCtx.canViewThread) {
      throw new InsufficientPermissionsException()
    }

    if (comment.authorId === userId) {
      return
    }

    if (!threadCtx.canModerateContent) {
      throw new InsufficientPermissionsException()
    }
  }

  assertCanReplyToComment(comment: CommentPolicySubject, threadCtx: ThreadAccessContext) {
    this.assertCanCreateThreadComment(threadCtx)

    if (comment.deletedAt) {
      throw new InsufficientPermissionsException()
    }
  }
}
