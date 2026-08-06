import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from 'src/nest/nest.access'
import { NestMemberRepository } from 'src/nest/member/nest-member.repository'
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
    private readonly nestAccess: NestAccess,
    private readonly memberRepo: NestMemberRepository,
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

    const actorCtx = await this.nestAccess.getContext(thread.nestId, userId)
    const authorMembership = await this.memberRepo.findByUser(thread.nestId, comment.authorId)

    if (authorMembership && actorCtx.role && !this.nestAccess.isHigherRole(actorCtx.role, authorMembership.role)) {
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
