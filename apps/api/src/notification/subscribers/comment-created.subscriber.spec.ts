import { NotificationType } from 'generated/prisma/enums'
import { createMockNotificationService } from 'test/factories/notification-service.mock-factory'
import { CommentCreatedEvent } from 'src/comment/events/comment-created.event'
import { CommentCreatedNotificationSubscriber } from './comment-created.subscriber'

describe('CommentCreatedNotificationSubscriber', () => {
  const notifications = createMockNotificationService()
  const subscriber = new CommentCreatedNotificationSubscriber(notifications as any)

  const baseProps = {
    commentId: 'comment-1',
    content: 'hello there',
    authorId: 'author-1',
    parentCommentId: null,
    recipientId: 'recipient-1',
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

  it('creates a THREAD_REPLY notification when there is no parent comment', async () => {
    await subscriber.handle(new CommentCreatedEvent(baseProps))

    expect(notifications.create).toHaveBeenCalledWith('recipient-1', 'author-1', 'nest-1', NotificationType.THREAD_REPLY, {
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
      commentId: 'comment-1',
      commentExcerpt: 'hello there'
    })
  })

  it('creates a COMMENT_REPLY notification when there is a parent comment', async () => {
    await subscriber.handle(new CommentCreatedEvent({ ...baseProps, parentCommentId: 'parent-1' }))

    expect(notifications.create).toHaveBeenCalledWith('recipient-1', 'author-1', 'nest-1', NotificationType.COMMENT_REPLY, expect.anything())
  })

  it('truncates a long comment into an excerpt', async () => {
    const longContent = 'a'.repeat(200)

    await subscriber.handle(new CommentCreatedEvent({ ...baseProps, content: longContent }))

    const data = notifications.create.mock.calls[0][4] as { commentExcerpt: string }
    expect(data.commentExcerpt).toBe(`${'a'.repeat(140)}…`)
  })

  it('does nothing when there is no recipient (self-reply)', async () => {
    await subscriber.handle(new CommentCreatedEvent({ ...baseProps, recipientId: null }))

    expect(notifications.create).not.toHaveBeenCalled()
  })
})
