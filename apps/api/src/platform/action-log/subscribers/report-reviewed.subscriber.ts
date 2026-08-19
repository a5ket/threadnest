import { Injectable } from '@nestjs/common'
import { PlatformActionType } from 'generated/prisma/enums'
import { PlatformReportReviewedEvent } from '../../events/platform-report-reviewed.event'
import { PlatformActionLogEventSubscriber } from '../platform-action-log-event-subscriber'
import { PlatformActionLogService } from '../platform-action-log.service'

@Injectable()
export class PlatformReportReviewedActionLogSubscriber extends PlatformActionLogEventSubscriber<PlatformReportReviewedEvent> {
  readonly eventClass = PlatformReportReviewedEvent

  constructor(private readonly actionLogs: PlatformActionLogService) { super() }

  async handle(event: PlatformReportReviewedEvent) {
    const { props } = event

    await this.actionLogs.create(props.reviewedById, null, props.nestId, PlatformActionType.REPORT_REVIEWED, {
      reportId: props.reportId,
      targetType: props.targetType,
      status: props.status
    })
  }
}
