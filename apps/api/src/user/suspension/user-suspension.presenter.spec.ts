import { createUserSuspension } from 'test/factories/user-suspension.factory'
import { UserSuspensionPresenter } from './user-suspension.presenter'

describe('UserSuspensionPresenter', () => {
  const presenter = new UserSuspensionPresenter()

  describe('toView', () => {
    it('presents the suspension record fields', () => {
      const suspension = createUserSuspension({ userId: 'user-1', reason: 'Spam', suspendedById: 'mod-1' })

      const view = presenter.toView(suspension)

      expect(view).toEqual({
        userId: 'user-1',
        reason: 'Spam',
        suspendedById: 'mod-1',
        createdAt: suspension.createdAt,
      })
    })
  })

  describe('toActiveView', () => {
    it('reports suspended=false with a null reason when there is no active suspension', () => {
      const view = presenter.toActiveView(null)

      expect(view).toEqual({ suspended: false, reason: null })
    })

    it('reports suspended=true with the reason when a suspension is active', () => {
      const view = presenter.toActiveView({ reason: 'Repeated harassment' })

      expect(view).toEqual({ suspended: true, reason: 'Repeated harassment' })
    })
  })
})
