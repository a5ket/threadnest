import { PlatformActionType } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformCommentRemovedEvent } from '../../events/platform-comment-removed.event'
import { PlatformCommentRemovedActionLogSubscriber } from './comment-removed.subscriber'

describe('PlatformCommentRemovedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformCommentRemovedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the removal', async () => {
    await subscriber.handle(new PlatformCommentRemovedEvent({
      commentId: 'comment-1',
      commentExcerpt: 'hello',
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      authorId: 'author-1',
      removedById: 'mod-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('mod-1', 'author-1', 'nest-1', PlatformActionType.COMMENT_REMOVED, {
      commentId: 'comment-1',
      commentExcerpt: 'hello',
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      nestSlug: 'nest-slug',
      nestName: 'Nest'
    })
  })
})
