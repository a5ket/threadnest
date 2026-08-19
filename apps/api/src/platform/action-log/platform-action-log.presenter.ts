import { Injectable } from '@nestjs/common'
import { PlatformActionLogResponseDto } from './dto/platform-action-log-response.dto'
import { PlatformActionLogDataByType } from './types/platform-action-log-data'
import { PlatformActionLogSummary } from './types/platform-action-log.summary'

@Injectable()
export class PlatformActionLogPresenter {
  toResponseView(log: PlatformActionLogSummary): PlatformActionLogResponseDto {
    const data = log.data as PlatformActionLogDataByType[keyof PlatformActionLogDataByType]

    return {
      id: log.id,
      type: log.type,
      actor: log.actor,
      target: log.target,
      nest: log.nest,
      createdAt: log.createdAt,
      data: { type: log.type, ...data } as PlatformActionLogResponseDto['data']
    }
  }
}
