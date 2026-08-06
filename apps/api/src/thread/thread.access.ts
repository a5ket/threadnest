import { Injectable } from '@nestjs/common'
import { MODERATION_GRACE_PERIOD_MS } from 'src/common/constants/moderation.constants'
import { NestAccess } from 'src/nest/nest.access'
import { ThreadAccessContext } from './types/thread.access-context'
import { ThreadPolicySubject } from './types/thread.policy-subject'

@Injectable()
export class ThreadAccess {
  constructor(
    private readonly nestAccess: NestAccess
  ) { }

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