import { BaseEvent } from 'src/event/base.event'
import { EventBus } from 'src/event/event-bus'

export const createMockEventBus = (): jest.Mocked<Pick<EventBus, 'publish'>> => ({
  publish: jest.fn<Promise<void>, [BaseEvent]>(),
})
