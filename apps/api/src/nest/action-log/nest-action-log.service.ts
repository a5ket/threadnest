import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { NestRepository } from '../nest.repository'
import { NestActionLogQueryDto } from './dto/nest-action-log.query.dto'
import { NestActionLogPolicy } from './nest-action-log.policy'
import { NestActionLogPresenter } from './nest-action-log.presenter'
import { NestActionLogRepository } from './nest-action-log.repository'
import { NestActionLogDataByType } from './types/nest-action-log-data'

@Injectable()
export class NestActionLogService {
  constructor(
    private readonly actionLogs: NestActionLogRepository,
    private readonly presenter: NestActionLogPresenter,
    private readonly policy: NestActionLogPolicy,
    private readonly nestsRepo: NestRepository
  ) { }

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

  async listByNest(nestSlug: string, actorUserId: string, query: NestActionLogQueryDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanViewActionLog(nest.id, actorUserId)

    const page = await this.actionLogs.listByNest(nest.id, query)

    return { items: page.items.map((log) => this.presenter.toResponseView(log)), meta: page.meta }
  }
}
