import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from 'src/nest/nest.access'
import { ThreadNotFoundException } from './exceptions/thread-not-found.exception'
import { ThreadAccess } from './thread.access'
import { ThreadPolicySubject } from './types/thread.policy-subject'
import { ThreadAccessContext } from './types/thread.access-context'


@Injectable()
export class ThreadPolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly threadAccess: ThreadAccess
  ) { }

  async assertCanCreateThread(nestId: string, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canCreateThread) {
      throw new InsufficientPermissionsException()
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async assertCanReadThread(threadAccessContext: ThreadAccessContext) {
    if (!threadAccessContext.canViewThread) {
      throw new ThreadNotFoundException()
    }
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
  }

  async assertCanManageThreadLock(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canManageThreadLock) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanManageThreadPin(thread: ThreadPolicySubject, actorUserId: string) {
    const ctx = await this.threadAccess.getContext(thread, actorUserId)

    if (!ctx.canViewThread) {
      throw new ThreadNotFoundException()
    }

    if (!ctx.canManageThreadPin) {
      throw new InsufficientPermissionsException()
    }
  }
}