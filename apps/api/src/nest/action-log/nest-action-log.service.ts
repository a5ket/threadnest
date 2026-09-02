import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { NestRepository } from '../nest.repository'
import { NestActionLogQueryDto } from './dto/nest-action-log.query.dto'
import { NestActionLogPolicy } from './nest-action-log.policy'
import { NestActionLogPresenter } from './nest-action-log.presenter'
import { NestActionLogRepository } from './nest-action-log.repository'
import { NestActionLogDataByType } from './types/nest-action-log-data'

/** Records and lists moderation actions taken within a nest (bans, removals, role changes, etc.). */
@Injectable()
export class NestActionLogService {
  constructor(
    private readonly actionLogs: NestActionLogRepository,
    private readonly presenter: NestActionLogPresenter,
    private readonly policy: NestActionLogPolicy,
    private readonly nestsRepo: NestRepository
  ) { }

  /**
   * Called by the moderation services themselves (ban, remove content, etc.) right after the
   * action succeeds — not exposed as its own endpoint.
   *
   * @param nestId - The nest the action happened in.
   * @param actorId - The moderator who took the action.
   * @param targetUserId - The affected user, if any (null for nest-wide actions like settings changes).
   * @param type - The kind of action, which determines the shape of `data`.
   * @param data - Type-specific details (e.g. a ban's reason).
   */
  async create<T extends NestActionType>(
    nestId: string,
    actorId: string,
    targetUserId: string | null,
    type: T,
    data: NestActionLogDataByType[T]
  ) {
    const log = await this.actionLogs.create(nestId, actorId, targetUserId, type, data)
    return this.presenter.toResponseView(log)
  }

  /**
   * @param nestSlug - The nest whose log to view.
   * @param actorUserId - Must be authorized to view this nest's action log.
   * @param query - Pagination.
   */
  async listByNest(nestSlug: string, actorUserId: string, query: NestActionLogQueryDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanViewActionLog(nest.id, actorUserId)

    const page = await this.actionLogs.listByNest(nest.id, query)

    return { items: page.items.map((log) => this.presenter.toResponseView(log)), meta: page.meta }
  }
}
