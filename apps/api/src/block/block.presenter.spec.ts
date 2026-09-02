import { UserPresenter } from 'src/user/user.presenter'
import { createBlockedUser } from 'test/factories/blocked-user.factory'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { BlockPresenter } from './block.presenter'

describe('BlockPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new BlockPresenter(new UserPresenter(storage as any))

  describe('toView', () => {
    it('presents the blocked user as a summary view with the block timestamp', () => {
      const block = createBlockedUser({
        createdAt: new Date('2024-03-01T00:00:00.000Z'),
        blocked: { id: 'user-2', profile: { username: 'lucky_fox5678', displayName: 'Lucky Fox', avatarKey: null } },
      })

      const view = presenter.toView(block)

      expect(view).toEqual({
        user: { id: 'user-2', username: 'lucky_fox5678', displayName: 'Lucky Fox', avatarUrl: null },
        blockedAt: new Date('2024-03-01T00:00:00.000Z'),
      })
    })
  })
})
