import { Injectable } from '@nestjs/common'
import { NestActionLogResponseDto } from './dto/nest-action-log-response.dto'
import { NestActionLogDataByType } from './types/nest-action-log-data'
import { NestActionLogSummary } from './types/nest-action-log.summary'

@Injectable()
export class NestActionLogPresenter {
  toResponseView(log: NestActionLogSummary): NestActionLogResponseDto {
    const data = log.data as NestActionLogDataByType[keyof NestActionLogDataByType]

    return {
      id: log.id,
      type: log.type,
      actor: log.actor,
      target: log.target,
      createdAt: log.createdAt,
      data: { type: log.type, ...data } as NestActionLogResponseDto['data']
    }
  }
}
