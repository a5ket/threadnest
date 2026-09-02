import { MessageResponseDto } from 'src/chat/message/dto/message-response.dto'
import { MessageCreatedEvent } from 'src/chat/message/events/message-created.event'
import { chatRoom } from '../realtime.gateway'
import { MessageCreatedRealtimeSubscriber } from './message-created.realtime-subscriber'

describe('MessageCreatedRealtimeSubscriber', () => {
  const emitToRoom = jest.fn()
  const gateway = { emitToRoom }

  const subscriber = new MessageCreatedRealtimeSubscriber(gateway as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('emits message:created to the chat\'s room', async () => {
    const message: MessageResponseDto = {
      id: 'message-1',
      chatId: 'chat-1',
      content: 'hello there',
      sender: { id: 'user-1', profile: { username: 'sender', displayName: null, avatarUrl: null } },
      replyTo: null,
      deletedAt: null,
      createdAt: new Date()
    }

    await subscriber.handle(new MessageCreatedEvent({ chatId: 'chat-1', message }))

    expect(emitToRoom).toHaveBeenCalledWith(chatRoom('chat-1'), 'message:created', message)
  })
})
