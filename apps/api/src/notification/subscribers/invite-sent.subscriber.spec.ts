import { NotificationType } from 'generated/prisma/enums'
import { createMockNotificationService } from 'test/factories/notification-service.mock-factory'
import { InviteSentEvent } from 'src/nest/invite/events/invite-sent.event'
import { InviteSentNotificationSubscriber } from './invite-sent.subscriber'

describe('InviteSentNotificationSubscriber', () => {
  const notifications = createMockNotificationService()
  const subscriber = new InviteSentNotificationSubscriber(notifications as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a NEST_INVITE_RECEIVED notification for the invited user', async () => {
    await subscriber.handle(new InviteSentEvent({
      inviteId: 'invite-1',
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      userId: 'invited-1',
      invitedById: 'inviter-1',
      message: 'welcome!'
    }))

    expect(notifications.create).toHaveBeenCalledWith('invited-1', 'inviter-1', 'nest-1', NotificationType.NEST_INVITE_RECEIVED, {
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      message: 'welcome!'
    })
  })
})
