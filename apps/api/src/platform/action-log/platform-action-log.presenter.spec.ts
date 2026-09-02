import { PlatformActionType } from 'generated/prisma/enums'
import { UserPresenter } from 'src/user/user.presenter'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { PlatformActionLogSummary } from './types/platform-action-log.summary'
import { PlatformActionLogPresenter } from './platform-action-log.presenter'

describe('PlatformActionLogPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new PlatformActionLogPresenter(new UserPresenter(storage as any))

  const baseLog = (overrides: Partial<PlatformActionLogSummary> = {}): PlatformActionLogSummary => ({
    id: 'log-1',
    type: PlatformActionType.USER_SUSPENDED,
    data: { reason: 'Spam' },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    actor: { id: 'admin-1', profile: null },
    target: { id: 'user-1', profile: null },
    nest: null,
    ...overrides,
  })

  describe('toResponseView', () => {
    it('resolves both the actor and target as user references', () => {
      const log = baseLog()

      const view = presenter.toResponseView(log)

      expect(view.actor).toMatchObject({ id: 'admin-1' })
      expect(view.target).toMatchObject({ id: 'user-1' })
    })

    it('returns a null target for actions with no target user', () => {
      const log = baseLog({ type: PlatformActionType.CONTENT_BULK_REMOVED, target: null, data: {} })

      const view = presenter.toResponseView(log)

      expect(view.target).toBeNull()
    })

    it('carries the nest reference through when the action was scoped to a nest', () => {
      const log = baseLog({ nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest' } })

      const view = presenter.toResponseView(log)

      expect(view.nest).toEqual({ id: 'nest-1', slug: 'nest-slug', name: 'Nest' })
    })

    it('returns a null nest for platform-wide actions', () => {
      const log = baseLog({ nest: null })

      const view = presenter.toResponseView(log)

      expect(view.nest).toBeNull()
    })

    it('merges the action type into the data payload', () => {
      const log = baseLog({ type: PlatformActionType.ROLE_GRANTED, data: { role: 'MODERATOR' } })

      const view = presenter.toResponseView(log)

      expect(view.data).toEqual({ type: PlatformActionType.ROLE_GRANTED, role: 'MODERATOR' })
    })
  })
})
