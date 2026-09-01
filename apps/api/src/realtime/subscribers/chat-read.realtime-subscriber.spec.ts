import { ChatReadEvent } from 'src/chat/events/chat-read.event'
import { chatRoom } from '../realtime.gateway'
import { ChatReadRealtimeSubscriber } from './chat-read.realtime-subscriber'

describe('ChatReadRealtimeSubscriber', () => {
  const emit = jest.fn()
  const to = jest.fn(() => ({ emit }))
  const gateway = { server: { to } }

  const subscriber = new ChatReadRealtimeSubscriber(gateway as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('emits chat:read to the chat\'s room', async () => {
    const at = new Date()

    await subscriber.handle(new ChatReadEvent({ chatId: 'chat-1', userId: 'user-1', at }))

    expect(to).toHaveBeenCalledWith(chatRoom('chat-1'))
    expect(emit).toHaveBeenCalledWith('chat:read', { chatId: 'chat-1', userId: 'user-1', at })
  })
})
