import { PlatformActionType, PlatformReportStatus, PlatformReportTargetType } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformReportReviewedEvent } from '../../events/platform-report-reviewed.event'
import { PlatformReportReviewedActionLogSubscriber } from './report-reviewed.subscriber'

describe('PlatformReportReviewedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformReportReviewedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the resolution of a USER-target report with no nest', async () => {
    await subscriber.handle(new PlatformReportReviewedEvent({
      reportId: 'report-1',
      targetType: PlatformReportTargetType.USER,
      status: PlatformReportStatus.RESOLVED,
      nestId: null,
      reviewedById: 'mod-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('mod-1', null, null, PlatformActionType.REPORT_REVIEWED, {
      reportId: 'report-1',
      targetType: PlatformReportTargetType.USER,
      status: PlatformReportStatus.RESOLVED
    })
  })

  it('logs the dismissal of a THREAD-target report with its nest', async () => {
    await subscriber.handle(new PlatformReportReviewedEvent({
      reportId: 'report-2',
      targetType: PlatformReportTargetType.THREAD,
      status: PlatformReportStatus.DISMISSED,
      nestId: 'nest-1',
      reviewedById: 'mod-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('mod-1', null, 'nest-1', PlatformActionType.REPORT_REVIEWED, {
      reportId: 'report-2',
      targetType: PlatformReportTargetType.THREAD,
      status: PlatformReportStatus.DISMISSED
    })
  })
})
