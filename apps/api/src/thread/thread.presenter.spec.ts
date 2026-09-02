import { UserPresenter } from 'src/user/user.presenter'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createThreadAccessContext } from 'test/factories/thread-access-context.factory'
import { createThreadDetails } from 'test/factories/thread-details.factory'
import { ThreadPresenter } from './thread.presenter'

describe('ThreadPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new ThreadPresenter(new UserPresenter(storage as any), storage as any)

  describe('toSummaryView', () => {
    it('resolves attachment URLs through the presigned URL storage call', async () => {
      const thread = createThreadDetails({
        attachments: [{ id: 'att-1', key: 'attachments/user-1/a.webp', width: 100, height: 100, order: 0 }],
      })

      const view = await presenter.toSummaryView(thread)

      expect(view.attachments).toEqual([{ id: 'att-1', key: 'attachments/user-1/a.webp', url: 'https://cdn.test/presigned/attachments/user-1/a.webp', width: 100, height: 100 }])
    })

    it('includes the author\'s nest role when a membership is present', async () => {
      const thread = createThreadDetails({
        author: { id: 'author-1', profile: null, nestMembership: [{ role: 'MODERATOR' }] },
      })

      const view = await presenter.toSummaryView(thread)

      expect(view.author).toMatchObject({ role: 'MODERATOR' })
    })

    it('reports a null role when the author has no membership', async () => {
      const thread = createThreadDetails({ author: { id: 'author-1', profile: null, nestMembership: [] } })

      const view = await presenter.toSummaryView(thread)

      expect(view.author).toMatchObject({ role: null })
    })
  })

  describe('toSearchResultView', () => {
    it('includes the nest reference alongside the summary fields', async () => {
      const thread = createThreadDetails({ nest: { name: 'My Nest', slug: 'my-nest' } })

      const view = await presenter.toSearchResultView(thread)

      expect(view.nest).toEqual({ name: 'My Nest', slug: 'my-nest' })
      expect(view).toHaveProperty('id')
    })
  })

  describe('toDetailView', () => {
    it('shows content when the viewer context allows reading it', async () => {
      const thread = createThreadDetails({ content: 'the actual content' })
      const ctx = createThreadAccessContext({ canReadContent: true })

      const view = await presenter.toDetailView(thread, ctx)

      expect(view.content).toBe('the actual content')
    })

    it('hides content when the viewer context disallows reading it', async () => {
      const thread = createThreadDetails({ content: 'the actual content' })
      const ctx = createThreadAccessContext({ canReadContent: false })

      const view = await presenter.toDetailView(thread, ctx)

      expect(view.content).toBeNull()
    })

    it('passes the access context through verbatim', async () => {
      const thread = createThreadDetails()
      const ctx = createThreadAccessContext({ canVoteThread: false, canSaveThread: false })

      const view = await presenter.toDetailView(thread, ctx)

      expect(view.access).toBe(ctx)
    })

    it('never exposes which platform admin removed the thread, even to nest moderators', async () => {
      const thread = createThreadDetails({
        deletedAt: new Date(),
        deletedById: 'platform-admin-1',
        deletedByPlatform: true,
      })
      const ctx = createThreadAccessContext({ canModerateContent: true })

      const view = await presenter.toDetailView(thread, ctx)

      expect(view.deletedById).toBeUndefined()
      expect(view.deletedByPlatform).toBe(true)
    })

    it('shows deletedById and deletedByPlatform to nest moderators for nest-removed threads', async () => {
      const thread = createThreadDetails({ deletedAt: new Date(), deletedById: 'moderator-1', deletedByPlatform: false })
      const ctx = createThreadAccessContext({ canModerateContent: true })

      const view = await presenter.toDetailView(thread, ctx)

      expect(view.deletedById).toBe('moderator-1')
      expect(view.deletedByPlatform).toBe(false)
    })

    it('hides deletedById and deletedByPlatform from regular (non-moderator) viewers, regardless of who removed it', async () => {
      const platformRemoved = createThreadDetails({ deletedAt: new Date(), deletedById: 'platform-admin-1', deletedByPlatform: true })
      const modRemoved = createThreadDetails({ deletedAt: new Date(), deletedById: 'moderator-1', deletedByPlatform: false })
      const ctx = createThreadAccessContext({ canModerateContent: false })

      const platformView = await presenter.toDetailView(platformRemoved, ctx)
      const modView = await presenter.toDetailView(modRemoved, ctx)

      expect(platformView.deletedById).toBeUndefined()
      expect(platformView.deletedByPlatform).toBeUndefined()
      expect(modView.deletedById).toBeUndefined()
      expect(modView.deletedByPlatform).toBeUndefined()
    })
  })
})
