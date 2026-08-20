import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { PlatformActionLogResponseDto } from './dto/platform-action-log-response.dto'
import { PlatformActionLogDataByType } from './types/platform-action-log-data'
import { PlatformActionLogSummary } from './types/platform-action-log.summary'

@Injectable()
export class PlatformActionLogPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  toResponseView(log: PlatformActionLogSummary): PlatformActionLogResponseDto {
    const data = log.data as PlatformActionLogDataByType[keyof PlatformActionLogDataByType]

    return {
      id: log.id,
      type: log.type,
      actor: this.userPresenter.toReferenceView(log.actor),
      target: log.target ? this.userPresenter.toReferenceView(log.target) : null,
      nest: log.nest,
      createdAt: log.createdAt,
      data: { type: log.type, ...data } as PlatformActionLogResponseDto['data']
    }
  }
}
