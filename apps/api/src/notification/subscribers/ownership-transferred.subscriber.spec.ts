import { NotificationType } from 'generated/prisma/enums'
import { createMockNotificationService } from 'test/factories/notification-service.mock-factory'
import { OwnershipTransferredEvent } from 'src/nest/events/ownership-transferred.event'
import { OwnershipTransferredNotificationSubscriber } from './ownership-transferred.subscriber'

describe('OwnershipTransferredNotificationSubscriber', () => {
  const notifications = createMockNotificationService()
  const subscriber = new OwnershipTransferredNotificationSubscriber(notifications as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates an OWNERSHIP_TRANSFERRED notification for the new owner', async () => {
    await subscriber.handle(new OwnershipTransferredEvent({
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      previousOwnerId: 'old-owner-1',
      newOwnerId: 'new-owner-1'
    }))

    expect(notifications.create).toHaveBeenCalledWith('new-owner-1', 'old-owner-1', 'nest-1', NotificationType.OWNERSHIP_TRANSFERRED, {
      nestSlug: 'nest-slug',
      nestName: 'Nest'
    })
  })
})
