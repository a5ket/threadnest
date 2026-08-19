import { Injectable } from '@nestjs/common'
import { NestMemberRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestMemberRepository } from 'src/nest/member/nest-member.repository'
import { NestAccess } from 'src/nest/nest.access'
import { ThreadNotFoundException } from './exceptions/thread-not-found.exception'
import { ThreadAccess } from './thread.access'
import { ThreadPolicySubject } from './types/thread.policy-subject'
import { ThreadAccessContext } from './types/thread.access-context'


@Injectable()
export class ThreadPolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly threadAccess: ThreadAccess,
    private readonly memberRepo: NestMemberRepository
  ) { }

  // Moderation actions (delete/lock/pin) against another member's thread must not let a lower-ranked
  // moderator act against a higher-ranked one. No-op when the actor is acting on their own thread.
  private async assertOutranksAuthor(thread: ThreadPolicySubject, actorUserId: string, actorRole: NestMemberRole | null) {
    if (thread.authorId === actorUserId) {
      return
    }

    const authorMembership = await this.memberRepo.findByUser(thread.nestId, thread.authorId)

    if (authorMembership && actorRole && !this.nestAccess.isHigherRole(actorRole, authorMembership.role)) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanCreateThread(nestId: string, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canCreateThread) {
      throw new InsufficientPermissionsException()
    }
  }

   
  async assertCanReadThreadContext(threadAccessContext: ThreadAccessContext) {
    if (!threadAccessContext.canViewThread) {
      throw new ThreadNotFoundException()
    }
  }

  // Self-contained variant for callers that don't already have a context on hand (e.g. other modules reusing this check) —
  // returns the context so callers who need it afterward (like a presenter) don't have to fetch it twice.
  async assertCanReadThread(thread: ThreadPolicySubject, actorUserId?: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    await this.assertCanReadThreadContext(ctx)

    return ctx
  }

  async assertCanReadThreads(nestId: string, actorUserId?: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canViewNest) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanUpdateThread(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canEditThread) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanDeleteThread(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canDeleteThread) {
      throw new InsufficientPermissionsException()
    }

    await this.assertOutranksAuthor(thread, actorUserId, ctx.role)
  }

  async assertCanManageThreadLock(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canManageThreadLock) {
      throw new InsufficientPermissionsException()
    }

    await this.assertOutranksAuthor(thread, actorUserId, ctx.role)
  }

  async assertCanManageThreadPin(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canManageThreadPin) {
      throw new InsufficientPermissionsException()
    }

    await this.assertOutranksAuthor(thread, actorUserId, ctx.role)
  }

  async assertCanVoteThread(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canVoteThread) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanSaveThread(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canSaveThread) {
      throw new InsufficientPermissionsException()
    }
  }
}