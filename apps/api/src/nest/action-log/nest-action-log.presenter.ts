import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { NestActionLogResponseDto } from './dto/nest-action-log-response.dto'
import { NestActionLogDataByType } from './types/nest-action-log-data'
import { NestActionLogSummary } from './types/nest-action-log.summary'

/** Shapes nest action log entries into API responses. */
@Injectable()
export class NestActionLogPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  /**
   * @param log - The log entry to present.
   * @returns The entry's view, with its type-specific `data` payload tagged with `type` so
   * clients can discriminate the union without a separate lookup.
   */
  toResponseView(log: NestActionLogSummary): NestActionLogResponseDto {
    const data = log.data as NestActionLogDataByType[keyof NestActionLogDataByType]

    return {
      id: log.id,
      type: log.type,
      actor: this.userPresenter.toReferenceView(log.actor),
      target: log.target ? this.userPresenter.toReferenceView(log.target) : null,
      createdAt: log.createdAt,
      data: { type: log.type, ...data } as NestActionLogResponseDto['data']
    }
  }
}
