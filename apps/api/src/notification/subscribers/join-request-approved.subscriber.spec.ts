import { NotificationType } from 'generated/prisma/enums'
import { createMockNotificationService } from 'test/factories/notification-service.mock-factory'
import { NestJoinRequestApprovedEvent } from 'src/nest/join-request/events/nest-join-request-approved.event'
import { JoinRequestApprovedNotificationSubscriber } from './join-request-approved.subscriber'

describe('JoinRequestApprovedNotificationSubscriber', () => {
  const notifications = createMockNotificationService()
  const subscriber = new JoinRequestApprovedNotificationSubscriber(notifications as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a JOIN_REQUEST_APPROVED notification for the requester', async () => {
    await subscriber.handle(new NestJoinRequestApprovedEvent({
      requestId: 'request-1',
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      userId: 'requester-1',
      approvedById: 'approver-1'
    }))

    expect(notifications.create).toHaveBeenCalledWith('requester-1', 'approver-1', 'nest-1', NotificationType.JOIN_REQUEST_APPROVED, {
      nestSlug: 'nest-slug',
      nestName: 'Nest'
    })
  })
})
