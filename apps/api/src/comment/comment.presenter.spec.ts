import { MODERATION_GRACE_PERIOD_MS } from 'src/common/constants/moderation.constants'
import { CommentPresenter } from './comment.presenter'
import { CommentWithRole } from './types/comment'

describe('CommentPresenter', () => {
  const presenter = new CommentPresenter()

  const baseComment = (overrides: Partial<CommentWithRole> = {}): CommentWithRole => ({
    id: 'comment-1',
    threadId: 'thread-1',
    authorId: 'author-1',
    parentId: null,
    content: 'hello',
    depth: 0,
    replyCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    editedAt: null,
    deletedAt: null,
    deletedById: null,
    author: { id: 'author-1', profile: null, nestMembership: [] },
    ...overrides,
  })

  it('shows content when not deleted', () => {
    const view = presenter.toView(baseComment())

    expect(view.content).toBe('hello')
    expect(view.author).not.toBeNull()
  })

  it('hides content and author from everyone, including moderators, on self-delete', () => {
    const comment = baseComment({ deletedAt: new Date(), deletedById: 'author-1' })

    const view = presenter.toView(comment, undefined, true)

    expect(view.content).toBeNull()
    expect(view.author).toBeNull()
  })

  it('shows moderator-removed content to a moderator within the grace period', () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'moderator-1',
    })

    const view = presenter.toView(comment, undefined, true)

    expect(view.content).toBe('hello')
    expect(view.author).not.toBeNull()
  })

  it('hides moderator-removed content from a non-moderator within the grace period', () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'moderator-1',
    })

    const view = presenter.toView(comment, undefined, false)

    expect(view.content).toBeNull()
    expect(view.author).toBeNull()
  })

  it('hides moderator-removed content from moderators once the grace period has passed', () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS - 1000),
      deletedById: 'moderator-1',
    })

    const view = presenter.toView(comment, undefined, true)

    expect(view.content).toBeNull()
    expect(view.author).toBeNull()
  })
})
