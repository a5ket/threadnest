import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformActionLogQueryDto } from './dto/platform-action-log.query.dto'
import { PlatformActionLogPolicy } from './platform-action-log.policy'
import { PlatformActionLogPresenter } from './platform-action-log.presenter'
import { PlatformActionLogRepository } from './platform-action-log.repository'
import { PlatformActionLogDataByType } from './types/platform-action-log-data'

@Injectable()
export class PlatformActionLogService {
  constructor(
    private readonly actionLogs: PlatformActionLogRepository,
    private readonly presenter: PlatformActionLogPresenter,
    private readonly policy: PlatformActionLogPolicy
  ) { }

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

  async list(actorUserId: string, query: PlatformActionLogQueryDto) {
    await this.policy.assertCanViewActionLog(actorUserId)

    const page = await this.actionLogs.list(query)

    return { items: page.items.map((log) => this.presenter.toResponseView(log)), meta: page.meta }
  }
}
