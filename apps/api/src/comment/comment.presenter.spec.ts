import { MODERATION_GRACE_PERIOD_MS } from 'src/common/constants/moderation.constants'
import { UserPresenter } from 'src/user/user.presenter'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { CommentPresenter } from './comment.presenter'
import { CommentNode, CommentWithRole } from './types/comment'

describe('CommentPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new CommentPresenter(new UserPresenter(storage as any), storage as any)

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
    attachments: [],
    author: { id: 'author-1', profile: null, nestMembership: [] },
    viewerVote: null,
    ...overrides,
  })

  it('shows content when not deleted', async () => {
    const view = await presenter.toView(baseComment())

    expect(view.content).toBe('hello')
    expect(view.author).not.toBeNull()
  })

  it('hides content and author from everyone, including moderators, on self-delete', async () => {
    const comment = baseComment({ deletedAt: new Date(), deletedById: 'author-1' })

    const view = await presenter.toView(comment, undefined, true)

    expect(view.content).toBeNull()
    expect(view.author).toBeNull()
  })

  it('shows moderator-removed content to a moderator within the grace period', async () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'moderator-1',
    })

    const view = await presenter.toView(comment, undefined, true)

    expect(view.content).toBe('hello')
    expect(view.author).not.toBeNull()
  })

  it('hides moderator-removed content from a non-moderator within the grace period', async () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'moderator-1',
    })

    const view = await presenter.toView(comment, undefined, false)

    expect(view.content).toBeNull()
    expect(view.author).toBeNull()
  })

  it('hides moderator-removed content from moderators once the grace period has passed', async () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS - 1000),
      deletedById: 'moderator-1',
    })

    const view = await presenter.toView(comment, undefined, true)

    expect(view.content).toBeNull()
    expect(view.author).toBeNull()
  })

  it('never exposes which platform admin removed the comment, even to nest moderators', async () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'platform-admin-1',
      deletedByPlatform: true,
    })

    const view = await presenter.toView(comment, undefined, true)

    expect(view.deletedById).toBeUndefined()
    expect(view.deletedByPlatform).toBe(true)
  })

  it('shows deletedById and deletedByPlatform to nest moderators for nest-removed content', async () => {
    const comment = baseComment({
      deletedAt: new Date(Date.now() - MODERATION_GRACE_PERIOD_MS / 2),
      deletedById: 'moderator-1',
      deletedByPlatform: false,
    })

    const view = await presenter.toView(comment, undefined, true)

    expect(view.deletedById).toBe('moderator-1')
    expect(view.deletedByPlatform).toBe(false)
  })

  it('hides deletedById and deletedByPlatform from regular (non-moderator) viewers, regardless of who removed it', async () => {
    const platformRemoved = baseComment({ deletedAt: new Date(), deletedById: 'platform-admin-1', deletedByPlatform: true })
    const modRemoved = baseComment({ deletedAt: new Date(), deletedById: 'moderator-1', deletedByPlatform: false })

    const platformView = await presenter.toView(platformRemoved, undefined, false)
    const modView = await presenter.toView(modRemoved, undefined, false)

    expect(platformView.deletedById).toBeUndefined()
    expect(platformView.deletedByPlatform).toBeUndefined()
    expect(modView.deletedById).toBeUndefined()
    expect(modView.deletedByPlatform).toBeUndefined()
  })

  it('hides content but not author identity when the author has blocked the viewer, on a non-deleted comment', async () => {
    const comment = baseComment()

    const view = await presenter.toView(comment, { viewerBlockedAuthor: false, authorBlockedViewer: true })

    expect(view.content).toBeNull()
    expect(view.author).not.toBeNull()
  })

  it('does not hide content just because the viewer blocked the author — that block is informational only', async () => {
    const comment = baseComment()

    const view = await presenter.toView(comment, { viewerBlockedAuthor: true, authorBlockedViewer: false })

    expect(view.content).toBe('hello')
    expect(view.viewerBlockedAuthor).toBe(true)
  })

  it('resolves an attached image through a presigned URL', async () => {
    const comment = baseComment({ attachments: [{ id: 'att-1', key: 'attachments/author-1/a.webp', width: 100, height: 100 }] })

    const view = await presenter.toView(comment)

    expect(view.attachment).toEqual({ url: 'https://cdn.test/presigned/attachments/author-1/a.webp', width: 100, height: 100 })
  })

  it('returns a null attachment when none is present', async () => {
    const view = await presenter.toView(baseComment())

    expect(view.attachment).toBeNull()
  })

  it('hides the attachment along with the content when redacted', async () => {
    const comment = baseComment({
      attachments: [{ id: 'att-1', key: 'attachments/author-1/a.webp', width: 100, height: 100 }],
      deletedAt: new Date(), deletedById: 'author-1',
    })

    const view = await presenter.toView(comment)

    expect(view.attachment).toBeNull()
  })

  describe('toNodeView', () => {
    const baseNode = (overrides: Partial<CommentNode> = {}): CommentNode => ({
      id: 'comment-1',
      threadId: 'thread-1',
      authorId: 'author-1',
      authorUsername: 'happy_otter1234',
      authorDisplayName: null,
      authorAvatarKey: null,
      authorRole: null,
      parentId: null,
      content: 'hello',
      replyCount: 0,
      score: 0,
      viewerVote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      editedAt: null,
      deletedAt: null,
      deletedById: null,
      deletedByPlatform: false,
      attachmentKey: null,
      attachmentWidth: null,
      attachmentHeight: null,
      depth: 0,
      viewerBlockedAuthor: false,
      authorBlockedViewer: false,
      ...overrides,
    })

    it('builds the author reference from the flat row fields, resolving the avatar as a public URL', async () => {
      const node = baseNode({ authorUsername: 'happy_otter1234', authorDisplayName: 'Happy Otter', authorAvatarKey: 'avatars/author-1/a.webp', authorRole: 'MEMBER' })

      const view = await presenter.toNodeView(node)

      expect(view.author).toEqual({
        id: 'author-1',
        profile: { username: 'happy_otter1234', displayName: 'Happy Otter', avatarUrl: 'https://cdn.test/avatars/author-1/a.webp' },
        role: 'MEMBER',
      })
    })

    it('hides the author and content on self-delete', async () => {
      const node = baseNode({ deletedAt: new Date(), deletedById: 'author-1' })

      const view = await presenter.toNodeView(node, true)

      expect(view.author).toBeNull()
      expect(view.content).toBeNull()
    })

    it('hides content the author has blocked the viewer from seeing', async () => {
      const node = baseNode({ authorBlockedViewer: true })

      const view = await presenter.toNodeView(node)

      expect(view.content).toBeNull()
    })

    it('resolves an attached image through a presigned URL', async () => {
      const node = baseNode({ attachmentKey: 'attachments/author-1/a.webp', attachmentWidth: 100, attachmentHeight: 100 })

      const view = await presenter.toNodeView(node)

      expect(view.attachment).toEqual({ url: 'https://cdn.test/presigned/attachments/author-1/a.webp', width: 100, height: 100 })
    })

    it('never exposes which platform admin removed the comment, even to nest moderators', async () => {
      const node = baseNode({ deletedAt: new Date(), deletedById: 'platform-admin-1', deletedByPlatform: true })

      const view = await presenter.toNodeView(node, true)

      expect(view.deletedById).toBeUndefined()
      expect(view.deletedByPlatform).toBe(true)
    })

    it('carries the tree depth through to the view', async () => {
      const node = baseNode({ depth: 3 })

      const view = await presenter.toNodeView(node)

      expect(view.depth).toBe(3)
    })
  })

  describe('toAuthorItemView', () => {
    it('maps the flat author-list row into a view, resolving the attachment', async () => {
      const item = {
        id: 'comment-1',
        content: 'hello',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        thread: { title: 'Thread', slug: 'thread-slug' },
        nest: { name: 'Nest', slug: 'nest-slug' },
        attachmentKey: 'attachments/author-1/a.webp',
        attachmentWidth: 100,
        attachmentHeight: 100,
      }

      const view = await presenter.toAuthorItemView(item)

      expect(view).toEqual({
        id: 'comment-1',
        content: 'hello',
        createdAt: item.createdAt,
        thread: item.thread,
        nest: item.nest,
        attachment: { url: 'https://cdn.test/presigned/attachments/author-1/a.webp', width: 100, height: 100 },
      })
    })
  })

  describe('toTreePage', () => {
    it('presents every node in the page and passes meta through unchanged', async () => {
      const meta = { total: 2, limit: 20, hasMore: false, nextCursor: null }
      const page = {
        items: [
          { id: 'c1', threadId: 't1', authorId: 'a1', authorUsername: null, authorDisplayName: null, authorAvatarKey: null, authorRole: null, parentId: null, content: 'one', replyCount: 0, score: 0, viewerVote: null, createdAt: new Date(), updatedAt: new Date(), editedAt: null, deletedAt: null, deletedById: null, deletedByPlatform: false, attachmentKey: null, attachmentWidth: null, attachmentHeight: null, depth: 0, viewerBlockedAuthor: false, authorBlockedViewer: false },
          { id: 'c2', threadId: 't1', authorId: 'a2', authorUsername: null, authorDisplayName: null, authorAvatarKey: null, authorRole: null, parentId: 'c1', content: 'two', replyCount: 0, score: 0, viewerVote: null, createdAt: new Date(), updatedAt: new Date(), editedAt: null, deletedAt: null, deletedById: null, deletedByPlatform: false, attachmentKey: null, attachmentWidth: null, attachmentHeight: null, depth: 1, viewerBlockedAuthor: false, authorBlockedViewer: false },
        ],
        meta,
      }

      const result = await presenter.toTreePage(page)

      expect(result.items).toHaveLength(2)
      expect(result.items.map((i) => i.id)).toEqual(['c1', 'c2'])
      expect(result.meta).toBe(meta)
    })
  })
})
