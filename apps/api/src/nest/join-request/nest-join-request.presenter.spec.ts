import { UserPresenter } from 'src/user/user.presenter'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createNestJoinRequestSummary } from 'test/factories/nest-join-request-summary.factory'
import { NestJoinRequestPresenter } from './nest-join-request.presenter'

describe('NestJoinRequestPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new NestJoinRequestPresenter(new UserPresenter(storage as any))

  describe('toUserView', () => {
    it('resolves resolvedBy as a user reference when the request has been resolved', () => {
      const request = createNestJoinRequestSummary({ resolvedBy: { id: 'mod-1', profile: null } })

      const view = presenter.toUserView(request)

      expect(view.resolvedBy).toMatchObject({ id: 'mod-1' })
    })

    it('returns a null resolvedBy while the request is still pending', () => {
      const request = createNestJoinRequestSummary({ resolvedBy: null })

      const view = presenter.toUserView(request)

      expect(view.resolvedBy).toBeNull()
    })

    it('does not include the requesting user in the user-facing view', () => {
      const request = createNestJoinRequestSummary()

      const view = presenter.toUserView(request)

      expect(view).not.toHaveProperty('user')
    })
  })

  describe('toNestView', () => {
    it('resolves the requesting user as a user reference', () => {
      const request = createNestJoinRequestSummary({ user: { id: 'requester-1', profile: null } })

      const view = presenter.toNestView(request)

      expect(view.user).toMatchObject({ id: 'requester-1' })
    })

    it('resolves resolvedBy as a user reference when the request has been resolved', () => {
      const request = createNestJoinRequestSummary({ resolvedBy: { id: 'mod-1', profile: null } })

      const view = presenter.toNestView(request)

      expect(view.resolvedBy).toMatchObject({ id: 'mod-1' })
    })

    it('returns a null resolvedBy while the request is still pending', () => {
      const request = createNestJoinRequestSummary({ resolvedBy: null })

      const view = presenter.toNestView(request)

      expect(view.resolvedBy).toBeNull()
    })
  })
})
