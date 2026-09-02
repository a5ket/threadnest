import { NestMemberRole } from 'generated/prisma/enums'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { UserSummary } from './types/user.summary'
import { UserPresenter } from './user.presenter'

describe('UserPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new UserPresenter(storage as any)

  const withProfile = (overrides: Partial<UserSummary['profile']> = {}): UserSummary => ({
    id: 'user-1',
    profile: { username: 'happy_otter1234', displayName: null, avatarKey: null, ...overrides },
  })

  const withoutProfile = (): UserSummary => ({ id: 'user-1', profile: null })

  describe('toSummaryView', () => {
    it('resolves username, displayName, and avatarUrl from the profile', () => {
      const user = withProfile({ username: 'happy_otter1234', displayName: 'Happy Otter', avatarKey: 'avatars/user-1/a.webp' })

      const view = presenter.toSummaryView(user)

      expect(view).toEqual({
        id: 'user-1',
        username: 'happy_otter1234',
        displayName: 'Happy Otter',
        avatarUrl: 'https://cdn.test/avatars/user-1/a.webp',
      })
    })

    it('defaults username, displayName, and avatarUrl to null when there is no profile', () => {
      const view = presenter.toSummaryView(withoutProfile())

      expect(view).toEqual({ id: 'user-1', username: null, displayName: null, avatarUrl: null })
    })

    it('returns a null avatarUrl when the profile has no avatar key', () => {
      const view = presenter.toSummaryView(withProfile({ avatarKey: null }))

      expect(view.avatarUrl).toBeNull()
    })
  })

  describe('toReferenceView', () => {
    it('nests username, displayName, and avatarUrl under profile when present', () => {
      const user = withProfile({ username: 'happy_otter1234', displayName: 'Happy Otter', avatarKey: 'avatars/user-1/a.webp' })

      const view = presenter.toReferenceView(user)

      expect(view.profile).toEqual({
        username: 'happy_otter1234',
        displayName: 'Happy Otter',
        avatarUrl: 'https://cdn.test/avatars/user-1/a.webp',
      })
    })

    it('returns a null profile when the user has none, e.g. a deleted account', () => {
      const view = presenter.toReferenceView(withoutProfile())

      expect(view.profile).toBeNull()
    })

    it('returns a null avatarUrl inside the profile when there is no avatar key', () => {
      const view = presenter.toReferenceView(withProfile({ avatarKey: null }))

      expect(view.profile?.avatarUrl).toBeNull()
    })

    it('omits the role field entirely when no role argument is passed', () => {
      const view = presenter.toReferenceView(withProfile())

      expect(view).not.toHaveProperty('role')
    })

    it('includes an explicit null role when the caller passes null, e.g. for a non-member author', () => {
      const view = presenter.toReferenceView(withProfile(), null)

      expect(view).toHaveProperty('role', null)
    })

    it('includes the role when the caller passes a real membership role', () => {
      const view = presenter.toReferenceView(withProfile(), NestMemberRole.MODERATOR)

      expect(view).toHaveProperty('role', NestMemberRole.MODERATOR)
    })
  })
})
