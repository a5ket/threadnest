import { NotificationType } from 'generated/prisma/enums'
import { createMockNotificationService } from 'test/factories/notification-service.mock-factory'
import { UserBannedEvent } from 'src/nest/ban/events/user-banned.event'
import { UserBannedNotificationSubscriber } from './user-banned.subscriber'

describe('UserBannedNotificationSubscriber', () => {
  const notifications = createMockNotificationService()
  const subscriber = new UserBannedNotificationSubscriber(notifications as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a BANNED_FROM_NEST notification for the banned user', async () => {
    await subscriber.handle(new UserBannedEvent({
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      userId: 'banned-1',
      bannedById: 'moderator-1',
      reason: 'spam'
    }))

    expect(notifications.create).toHaveBeenCalledWith('banned-1', 'moderator-1', 'nest-1', NotificationType.BANNED_FROM_NEST, {
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      reason: 'spam'
    })
  })
})
