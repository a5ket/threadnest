import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformActionLogQueryDto } from './dto/platform-action-log.query.dto'
import { PlatformActionLogPolicy } from './platform-action-log.policy'
import { PlatformActionLogPresenter } from './platform-action-log.presenter'
import { PlatformActionLogRepository } from './platform-action-log.repository'
import { PlatformActionLogDataByType } from './types/platform-action-log-data'

/** Records and lists the platform-wide moderation audit trail. */
@Injectable()
export class PlatformActionLogService {
  constructor(
    private readonly actionLogs: PlatformActionLogRepository,
    private readonly presenter: PlatformActionLogPresenter,
    private readonly policy: PlatformActionLogPolicy
  ) { }

  /**
   * No authorization check here — this only records an action that already happened, so the
   * actor already passed whatever check gated the action itself.
   *
   * @param actorId - The moderator/admin who performed the action.
   * @param targetUserId - The user the action targeted, or `null` if not user-targeted (e.g. a
   * NEST-target report review).
   * @param nestId - The nest the action relates to, or `null` if not nest-scoped.
   * @param type - The kind of action.
   * @param data - Type-specific details, keyed by `type` via {@link PlatformActionLogDataByType}.
   * @returns The created log entry's view.
   */
  async create<T extends PlatformActionType>(
    actorId: string,
    targetUserId: string | null,
    nestId: string | null,
    type: T,
    data: PlatformActionLogDataByType[T]
  ) {
    const log = await this.actionLogs.create(actorId, targetUserId, nestId, type, data)
    return this.presenter.toResponseView(log)
  }

  /**
   * @param actorUserId - The moderator viewing the log.
   * @param query - Pagination and filter options.
   * @returns A page of action log entries.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform moderator or admin.
   */
  async list(actorUserId: string, query: PlatformActionLogQueryDto) {
    await this.policy.assertCanViewActionLog(actorUserId)

    const page = await this.actionLogs.list(query)

    return { items: page.items.map((log) => this.presenter.toResponseView(log)), meta: page.meta }
  }
}
