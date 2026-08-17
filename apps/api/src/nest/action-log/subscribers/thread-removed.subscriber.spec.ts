import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { ThreadDeletedEvent } from 'src/thread/events/thread-deleted.event'
import { ThreadRemovedActionLogSubscriber } from './thread-removed.subscriber'

describe('ThreadRemovedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new ThreadRemovedActionLogSubscriber(actionLogs as any)

  const baseProps = {
    threadId: 'thread-1',
    title: 'Thread title',
    slug: 'thread-slug',
    nestId: 'nest-1',
    nestSlug: 'nest-slug',
    nestName: 'Nest',
    authorId: 'author-1',
    deletedById: 'moderator-1',
    recipientId: 'author-1'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs a moderator removal', async () => {
    await subscriber.handle(new ThreadDeletedEvent(baseProps))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'moderator-1', 'author-1', NestActionType.THREAD_REMOVED, {
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title'
    })
  })

  it('does nothing on a self-delete', async () => {
    await subscriber.handle(new ThreadDeletedEvent({ ...baseProps, deletedById: 'author-1', recipientId: null }))

    expect(actionLogs.create).not.toHaveBeenCalled()
  })
})
