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
    score: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    editedAt: null,
    deletedAt: null,
    deletedById: null,
    deletedByPlatform: false,
    author: { id: 'author-1', profile: null, nestMembership: [] },
    viewerVote: null,
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

  it('never exposes which platform admin removed the comment, even to nest moderators', () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'platform-admin-1',
      deletedByPlatform: true,
    })

    const view = presenter.toView(comment, undefined, true)

    expect(view.deletedById).toBeUndefined()
    expect(view.deletedByPlatform).toBe(true)
  })

  it('shows deletedById and deletedByPlatform to nest moderators for nest-removed content', () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'moderator-1',
      deletedByPlatform: false,
    })

    const view = presenter.toView(comment, undefined, true)

    expect(view.deletedById).toBe('moderator-1')
    expect(view.deletedByPlatform).toBe(false)
  })

  it('hides deletedById and deletedByPlatform from regular (non-moderator) viewers, regardless of who removed it', () => {
    const platformRemoved = baseComment({ deletedAt: new Date(), deletedById: 'platform-admin-1', deletedByPlatform: true })
    const modRemoved = baseComment({ deletedAt: new Date(), deletedById: 'moderator-1', deletedByPlatform: false })

    const platformView = presenter.toView(platformRemoved, undefined, false)
    const modView = presenter.toView(modRemoved, undefined, false)

    expect(platformView.deletedById).toBeUndefined()
    expect(platformView.deletedByPlatform).toBeUndefined()
    expect(modView.deletedById).toBeUndefined()
    expect(modView.deletedByPlatform).toBeUndefined()
  })
})
