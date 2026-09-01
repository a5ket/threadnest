import { NotificationType } from 'generated/prisma/enums'
import { NotificationResponseDto } from 'src/notification/dto/notification-response.dto'
import { NotificationCreatedEvent } from 'src/notification/events/notification-created.event'
import { userRoom } from '../realtime.gateway'
import { NotificationCreatedRealtimeSubscriber } from './notification-created.realtime-subscriber'

describe('NotificationCreatedRealtimeSubscriber', () => {
  const emit = jest.fn()
  const to = jest.fn(() => ({ emit }))
  const gateway = { server: { to } }

  const subscriber = new NotificationCreatedRealtimeSubscriber(gateway as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('emits notification:created to the recipient\'s room', async () => {
    const notification: NotificationResponseDto = {
      id: 'notification-1',
      type: NotificationType.THREAD_REPLY,
      actor: null,
      createdAt: new Date(),
      readAt: null,
      data: {
        type: 'THREAD_REPLY',
        nestSlug: 'nest-slug',
        nestName: 'Nest',
        threadSlug: 'thread-slug',
        threadTitle: 'Thread title',
        commentId: 'comment-1',
        commentExcerpt: 'hello there'
      }
    }

    await subscriber.handle(new NotificationCreatedEvent({ userId: 'user-1', notification }))

    expect(to).toHaveBeenCalledWith(userRoom('user-1'))
    expect(emit).toHaveBeenCalledWith('notification:created', notification)
  })
})
