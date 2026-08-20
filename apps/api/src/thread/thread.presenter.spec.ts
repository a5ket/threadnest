import { UserPresenter } from 'src/user/user.presenter'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createThreadAccessContext } from 'test/factories/thread-access-context.factory'
import { createThreadDetails } from 'test/factories/thread-details.factory'
import { ThreadPresenter } from './thread.presenter'

describe('ThreadPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new ThreadPresenter(new UserPresenter(storage as any), storage as any)

  describe('toDetailView', () => {
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
