import { PlatformReportStatus, PlatformReportTargetType } from 'generated/prisma/enums'
import { BaseEvent } from 'src/event/base.event'

export class PlatformReportReviewedEvent extends BaseEvent {
  constructor(
    public readonly props: {
      reportId: string
      targetType: PlatformReportTargetType
      status: Exclude<PlatformReportStatus, 'PENDING'>
      nestId: string | null
      reviewedById: string
    }
  ) { super() }
}
