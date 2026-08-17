import { NestActionType, ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { ReportResolvedEvent } from 'src/report/events/report-resolved.event'
import { ReportResolvedActionLogSubscriber } from './report-resolved.subscriber'

describe('ReportResolvedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new ReportResolvedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the resolution with no target user', async () => {
    await subscriber.handle(new ReportResolvedEvent({
      reportId: 'report-1',
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      reporterId: 'reporter-1',
      resolvedById: 'moderator-1',
      status: ReportStatus.RESOLVED,
      targetType: ReportTargetType.THREAD,
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      commentId: null
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'moderator-1', null, NestActionType.REPORT_RESOLVED, {
      reportId: 'report-1',
      status: ReportStatus.RESOLVED,
      targetType: ReportTargetType.THREAD,
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      commentId: null
    })
  })
})
