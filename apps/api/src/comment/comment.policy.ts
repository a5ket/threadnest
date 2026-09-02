import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from 'src/nest/nest.access'
import { NestMemberRepository } from 'src/nest/member/nest-member.repository'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { ThreadAccess } from 'src/thread/thread.access'
import { ThreadAccessContext } from 'src/thread/types/thread.access-context'
import { ThreadRepository } from 'src/thread/thread.repository'
import { CommentPolicySubject } from './types/comment.policy-subject'

/**
 * Comment-level authorization, layered on top of {@link ThreadAccess} — most checks start from
 * an already-computed thread context.
 */
@Injectable()
export class CommentPolicy {
  constructor(
    private readonly threadAccess: ThreadAccess,
    private readonly threadsRepo: ThreadRepository,
    private readonly nestAccess: NestAccess,
    private readonly memberRepo: NestMemberRepository,
  ) { }

  /**
   * @throws {ThreadNotFoundException} Thread not visible.
   * @throws {InsufficientPermissionsException} Not authorized to comment.
   */
  assertCanCreateThreadComment(threadCtx: ThreadAccessContext) {
    if (!threadCtx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!threadCtx.canCommentThread) {
      throw new InsufficientPermissionsException()
    }
  }

  /** @throws {ThreadNotFoundException} Thread not visible. */
  assertCanReadThreadComment(threadCtx: ThreadAccessContext) {
    if (!threadCtx.canViewThread) {
      throw new ThreadNotFoundException()
    }
  }

  /**
   * @throws {ThreadNotFoundException} Thread not visible.
   * @throws {InsufficientPermissionsException} Not the author, or the comment is deleted.
   */
  assertCanUpdateComment(comment: CommentPolicySubject, userId: string, threadCtx: ThreadAccessContext) {
    if (!threadCtx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (comment.deletedAt || comment.authorId !== userId) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * The author can always delete their own comment. A moderator deleting someone else's must
   * outrank the author's nest role, same as the thread/ban moderation checks elsewhere.
   *
   * @throws {ThreadNotFoundException} Thread not visible.
   * @throws {InsufficientPermissionsException} Already deleted, or not the author/a moderator
   *   who outranks the comment's author.
   */
  async assertCanDeleteComment(comment: CommentPolicySubject, userId: string) {
    const thread = await this.threadsRepo.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, userId)

    if (!threadCtx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (comment.deletedAt) {
      throw new InsufficientPermissionsException()
    }

    if (comment.authorId === userId) {
      return
    }

    if (!threadCtx.canModerateContent) {
      throw new InsufficientPermissionsException()
    }

    const authorMembership = await this.memberRepo.findByUser(thread.nestId, comment.authorId)

    if (authorMembership && threadCtx.role && !this.nestAccess.isHigherRole(threadCtx.role, authorMembership.role)) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @throws {ThreadNotFoundException} Thread not visible.
   * @throws {InsufficientPermissionsException} Not authorized to comment, or the parent comment is deleted.
   */
  assertCanReplyToComment(comment: CommentPolicySubject, threadCtx: ThreadAccessContext) {
    this.assertCanCreateThreadComment(threadCtx)

    if (comment.deletedAt) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @throws {ThreadNotFoundException} Thread not visible.
   * @throws {InsufficientPermissionsException} The comment is deleted, or not authorized to vote.
   */
  assertCanVoteOnComment(comment: CommentPolicySubject, threadCtx: ThreadAccessContext) {
    if (!threadCtx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (comment.deletedAt || !threadCtx.canVoteComment) {
      throw new InsufficientPermissionsException()
    }
  }
}
