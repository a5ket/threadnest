import { UserPresenter } from 'src/user/user.presenter'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createNestInviteSummary } from 'test/factories/nest-invite-summary.factory'
import { NestInvitePresenter } from './nest-invite.presenter'

describe('NestInvitePresenter', () => {
  const storage = createMockStorageService()
  const presenter = new NestInvitePresenter(new UserPresenter(storage as any))

  describe('toUserView', () => {
    it('resolves resolvedBy as a user reference when the invite has been resolved', () => {
      const invite = createNestInviteSummary({ resolvedBy: { id: 'mod-1', profile: null } })

      const view = presenter.toUserView(invite)

      expect(view.resolvedBy).toMatchObject({ id: 'mod-1' })
    })

    it('returns a null resolvedBy while the invite is still pending', () => {
      const invite = createNestInviteSummary({ resolvedBy: null })

      const view = presenter.toUserView(invite)

      expect(view.resolvedBy).toBeNull()
    })

    it('does not include the invited user in the user-facing view', () => {
      const invite = createNestInviteSummary()

      const view = presenter.toUserView(invite)

      expect(view).not.toHaveProperty('user')
    })
  })

  describe('toNestView', () => {
    it('resolves both the invited user and inviter as user references', () => {
      const invite = createNestInviteSummary({
        user: { id: 'invitee-1', profile: null },
        invitedBy: { id: 'actor-1', profile: null },
      })

      const view = presenter.toNestView(invite)

      expect(view.user).toMatchObject({ id: 'invitee-1' })
      expect(view.invitedBy).toMatchObject({ id: 'actor-1' })
    })

    it('resolves resolvedBy as a user reference when the invite has been resolved', () => {
      const invite = createNestInviteSummary({ resolvedBy: { id: 'mod-1', profile: null } })

      const view = presenter.toNestView(invite)

      expect(view.resolvedBy).toMatchObject({ id: 'mod-1' })
    })

    it('returns a null resolvedBy while the invite is still pending', () => {
      const invite = createNestInviteSummary({ resolvedBy: null })

      const view = presenter.toNestView(invite)

      expect(view.resolvedBy).toBeNull()
    })
  })
})
