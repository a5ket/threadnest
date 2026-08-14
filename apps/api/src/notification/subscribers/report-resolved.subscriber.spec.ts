import { ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { NotificationType } from 'generated/prisma/enums'
import { createMockNotificationService } from 'test/factories/notification-service.mock-factory'
import { ReportResolvedEvent } from 'src/report/events/report-resolved.event'
import { ReportResolvedNotificationSubscriber } from './report-resolved.subscriber'

describe('ReportResolvedNotificationSubscriber', () => {
  const notifications = createMockNotificationService()
  const subscriber = new ReportResolvedNotificationSubscriber(notifications as any)

  const baseProps = {
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
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a REPORT_RESOLVED notification for the reporter', async () => {
    await subscriber.handle(new ReportResolvedEvent(baseProps))

    expect(notifications.create).toHaveBeenCalledWith('reporter-1', 'moderator-1', 'nest-1', NotificationType.REPORT_RESOLVED, {
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      status: ReportStatus.RESOLVED,
      targetType: ReportTargetType.THREAD,
      commentId: null
    })
  })

  it('does nothing when the reporter resolved their own report', async () => {
    await subscriber.handle(new ReportResolvedEvent({ ...baseProps, resolvedById: 'reporter-1' }))

    expect(notifications.create).not.toHaveBeenCalled()
  })
})
