import { ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { BaseEvent } from 'src/event/base.event'

export class ReportResolvedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      reportId: string
      nestId: string
      nestSlug: string
      nestName: string
      reporterId: string
      resolvedById: string
      status: Exclude<ReportStatus, 'PENDING'>
      targetType: ReportTargetType
      threadSlug: string
      threadTitle: string
      commentId: string | null
    }
  ) { super() }
}
