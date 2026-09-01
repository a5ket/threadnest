import { NestDeletedEvent } from 'src/nest/events/nest-deleted.event'
import { NestDeletedSubscriptionSubscriber } from './nest-deleted.subscriber'

describe('NestDeletedSubscriptionSubscriber', () => {
  const subscriptions = { cancelAllForNest: jest.fn() }
  const subscriber = new NestDeletedSubscriptionSubscriber(subscriptions as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('cancels every subscription for the deleted nest', async () => {
    await subscriber.handle(new NestDeletedEvent({ nestId: 'nest-1', userId: 'user-1' }))

    expect(subscriptions.cancelAllForNest).toHaveBeenCalledWith('nest-1')
  })
})
