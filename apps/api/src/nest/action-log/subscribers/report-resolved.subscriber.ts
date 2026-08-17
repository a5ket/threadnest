import { Injectable } from '@nestjs/common'
import { NestActionType } from 'generated/prisma/enums'
import { ReportResolvedEvent } from 'src/report/events/report-resolved.event'
import { NestActionLogEventSubscriber } from '../nest-action-log-event-subscriber'
import { NestActionLogService } from '../nest-action-log.service'

@Injectable()
export class ReportResolvedActionLogSubscriber extends NestActionLogEventSubscriber<ReportResolvedEvent> {
  readonly eventClass = ReportResolvedEvent

  constructor(private readonly actionLogs: NestActionLogService) { super() }

  async handle(event: ReportResolvedEvent) {
    const { props } = event

    await this.actionLogs.create(props.nestId, props.resolvedById, null, NestActionType.REPORT_RESOLVED, {
      reportId: props.reportId,
      status: props.status,
      targetType: props.targetType,
      threadSlug: props.threadSlug,
      threadTitle: props.threadTitle,
      commentId: props.commentId
    })
  }
}
