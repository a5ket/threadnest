import { NotificationType } from 'generated/prisma/enums'
import { createMockNotificationService } from 'test/factories/notification-service.mock-factory'
import { NestJoinRequestRejectedEvent } from 'src/nest/join-request/events/nest-join-request-rejected.event'
import { JoinRequestRejectedNotificationSubscriber } from './join-request-rejected.subscriber'

describe('JoinRequestRejectedNotificationSubscriber', () => {
  const notifications = createMockNotificationService()
  const subscriber = new JoinRequestRejectedNotificationSubscriber(notifications as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a JOIN_REQUEST_REJECTED notification for the requester', async () => {
    await subscriber.handle(new NestJoinRequestRejectedEvent({
      requestId: 'request-1',
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      userId: 'requester-1',
      rejectedById: 'rejector-1'
    }))

    expect(notifications.create).toHaveBeenCalledWith('requester-1', 'rejector-1', 'nest-1', NotificationType.JOIN_REQUEST_REJECTED, {
      nestSlug: 'nest-slug',
      nestName: 'Nest'
    })
  })
})
