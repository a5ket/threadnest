import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { CommentDeletedEvent } from 'src/comment/events/comment-deleted.event'
import { CommentRemovedActionLogSubscriber } from './comment-removed.subscriber'

describe('CommentRemovedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new CommentRemovedActionLogSubscriber(actionLogs as any)

  const baseProps = {
    commentId: 'comment-1',
    content: 'hello there',
    authorId: 'author-1',
    deletedById: 'moderator-1',
    recipientId: 'author-1',
    threadId: 'thread-1',
    threadSlug: 'thread-slug',
    threadTitle: 'Thread title',
    nestId: 'nest-1',
    nestSlug: 'nest-slug',
    nestName: 'Nest'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs a moderator removal', async () => {
    await subscriber.handle(new CommentDeletedEvent(baseProps))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'moderator-1', 'author-1', NestActionType.COMMENT_REMOVED, {
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      commentId: 'comment-1',
      commentExcerpt: 'hello there'
    })
  })

  it('does nothing on a self-delete', async () => {
    await subscriber.handle(new CommentDeletedEvent({ ...baseProps, deletedById: 'author-1', recipientId: null }))

    expect(actionLogs.create).not.toHaveBeenCalled()
  })
})
