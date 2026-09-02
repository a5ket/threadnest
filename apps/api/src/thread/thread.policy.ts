import { Injectable } from '@nestjs/common'
import { NestMemberRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestMemberRepository } from 'src/nest/member/nest-member.repository'
import { NestAccess } from 'src/nest/nest.access'
import { ThreadNotFoundException } from './exceptions/thread-not-found.exception'
import { ThreadAccess } from './thread.access'
import { ThreadPolicySubject } from './types/thread.policy-subject'
import { ThreadAccessContext } from './types/thread.access-context'


/** Thread-level authorization, built on top of {@link ThreadAccess} and {@link NestAccess}. */
@Injectable()
export class ThreadPolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly threadAccess: ThreadAccess,
    private readonly memberRepo: NestMemberRepository
  ) { }

  /**
   * Moderation actions (delete/lock/pin) against another member's thread must not let a
   * lower-ranked moderator act against a higher-ranked one. No-op when the actor is acting on
   * their own thread.
   *
   * @throws {InsufficientPermissionsException} `actorRole` doesn't outrank the author's role.
   */
  private async assertOutranksAuthor(thread: ThreadPolicySubject, actorUserId: string, actorRole: NestMemberRole | null) {
    if (thread.authorId === actorUserId) {
      return
    }

    const authorMembership = await this.memberRepo.findByUser(thread.nestId, thread.authorId)

    if (authorMembership && actorRole && !this.nestAccess.isHigherRole(actorRole, authorMembership.role)) {
      throw new InsufficientPermissionsException()
    }
  }

  /** @throws {InsufficientPermissionsException} Not authorized to create threads in this nest. */
  async assertCanCreateThread(nestId: string, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canCreateThread) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * Checks a context the caller already computed — see {@link assertCanReadThread} for the
   * self-contained variant.
   *
   * @throws {ThreadNotFoundException} The thread is deleted or otherwise not visible — a 404,
   *   not a 403, so its existence isn't leaked to unauthorized viewers.
   */
  async assertCanReadThreadContext(threadAccessContext: ThreadAccessContext) {
    if (!threadAccessContext.canViewThread) {
      throw new ThreadNotFoundException()
    }
  }

  /**
   * Self-contained variant for callers without a context on hand — returns the context so
   * callers who need it afterward (like a presenter) don't have to fetch it twice.
   *
   * @throws {ThreadNotFoundException} See {@link assertCanReadThreadContext}.
   */
  async assertCanReadThread(thread: ThreadPolicySubject, actorUserId?: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    await this.assertCanReadThreadContext(ctx)

    return ctx
  }

  /** @throws {InsufficientPermissionsException} Not authorized to view this nest. */
  async assertCanReadThreads(nestId: string, actorUserId?: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canViewNest) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @throws {ThreadNotFoundException} Not visible to `actorUserId`.
   * @throws {InsufficientPermissionsException} Not the author, or the thread is deleted.
   */
  async assertCanUpdateThread(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canEditThread) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @throws {ThreadNotFoundException} Not visible to `actorUserId`.
   * @throws {InsufficientPermissionsException} Not the author/a moderator, or outranked by the author.
   */
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

  /**
   * @throws {ThreadNotFoundException} Not visible to `actorUserId`.
   * @throws {InsufficientPermissionsException} Not authorized to lock threads, or outranked by the author.
   */
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

  /**
   * @throws {ThreadNotFoundException} Not visible to `actorUserId`.
   * @throws {InsufficientPermissionsException} Not authorized to pin threads, or outranked by the author.
   */
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

  /**
   * @throws {ThreadNotFoundException} Not visible to `actorUserId`.
   * @throws {InsufficientPermissionsException} Not authorized to vote in this nest.
   */
  async assertCanVoteThread(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canVoteThread) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @throws {ThreadNotFoundException} Not visible to `actorUserId`.
   * @throws {InsufficientPermissionsException} The thread is deleted.
   */
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