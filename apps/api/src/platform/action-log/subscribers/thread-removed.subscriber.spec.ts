import { PlatformActionType } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformThreadRemovedEvent } from '../../events/platform-thread-removed.event'
import { PlatformThreadRemovedActionLogSubscriber } from './thread-removed.subscriber'

describe('PlatformThreadRemovedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformThreadRemovedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the removal', async () => {
    await subscriber.handle(new PlatformThreadRemovedEvent({
      threadId: 'thread-1',
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      authorId: 'author-1',
      removedById: 'mod-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('mod-1', 'author-1', 'nest-1', PlatformActionType.THREAD_REMOVED, {
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      nestSlug: 'nest-slug',
      nestName: 'Nest'
    })
  })
})
