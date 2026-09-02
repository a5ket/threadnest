import { Injectable } from '@nestjs/common'
import { MODERATION_GRACE_PERIOD_MS } from 'src/common/constants/moderation.constants'
import { NestAccess } from 'src/nest/nest.access'
import { ThreadAccessContext } from './types/thread.access-context'
import { ThreadPolicySubject } from './types/thread.policy-subject'

/**
 * Computes what a viewer can do with a specific thread — layers deletion/lock/pin state on top
 * of {@link NestAccess}'s nest-level permissions.
 */
@Injectable()
export class ThreadAccess {
  constructor(
    private readonly nestAccess: NestAccess
  ) { }

  /**
   * A deleted thread's content is normally hidden, with one exception: a nest moderator can still
   * read it for a short grace period after removal (to review what was actually said) — but only
   * if a *moderator* deleted it. Content the author deleted themselves is never re-readable,
   * regardless of role.
   *
   * @param thread - The thread to compute access for.
   * @param userId - The viewer, or undefined for an anonymous request.
   * @returns The full set of `can*` flags plus author/deletion/lock/pin state.
   */
  async getContext(
    thread: ThreadPolicySubject,
    userId?: string
  ): Promise<ThreadAccessContext> {
    const nestAccess = await this.nestAccess.getContext(thread.nestId, userId)

    const isAuthor = thread.authorId === userId
    const isDeleted = thread.deletedAt !== null
    const isLocked = thread.lockedAt !== null
    const isPinned = thread.pinnedAt !== null

    const isDeletedByAuthor = isDeleted && thread.deletedById === thread.authorId
    const withinGracePeriod = isDeleted && thread.deletedAt !== null && Date.now() - thread.deletedAt.getTime() < MODERATION_GRACE_PERIOD_MS
    const canReadDeletedContent = isDeleted && !isDeletedByAuthor && nestAccess.canModerateContent && withinGracePeriod

    const canReadContent = !isDeleted || canReadDeletedContent
    const canViewThread = nestAccess.canViewNest && canReadContent


    return {
      role: nestAccess.role,
      isAuthor,
      isDeleted,
      isLocked,
      isPinned,

      canViewThread,
      canReadContent,

      canEditThread:
        canViewThread &&
        isAuthor &&
        !isDeleted,

      canDeleteThread:
        canViewThread &&
        !isDeleted &&
        (isAuthor || nestAccess.canModerateContent),

      canCommentThread:
        canViewThread &&
        !isDeleted &&
        !isLocked &&
        nestAccess.canCreateComment,

      canVoteThread:
        canViewThread &&
        !isDeleted &&
        nestAccess.canVoteThread,

      canSaveThread:
        canViewThread &&
        !isDeleted,

      canVoteComment:
        canViewThread &&
        !isDeleted &&
        nestAccess.canVoteComment,

      canModerateContent: nestAccess.canModerateContent,

      canManageThreadLock:
        canViewThread &&
        !isDeleted &&
        nestAccess.canManageThreadLock,

      canManageThreadPin:
        canViewThread &&
        !isDeleted &&
        nestAccess.canManageThreadPin
    }
  }
}