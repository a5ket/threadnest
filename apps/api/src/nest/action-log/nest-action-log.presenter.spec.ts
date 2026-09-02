import { NestActionType } from 'generated/prisma/enums'
import { UserPresenter } from 'src/user/user.presenter'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { NestActionLogSummary } from './types/nest-action-log.summary'
import { NestActionLogPresenter } from './nest-action-log.presenter'

describe('NestActionLogPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new NestActionLogPresenter(new UserPresenter(storage as any))

  const baseLog = (overrides: Partial<NestActionLogSummary> = {}): NestActionLogSummary => ({
    id: 'log-1',
    type: NestActionType.MEMBER_BANNED,
    data: { reason: 'Spam' },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    actor: { id: 'mod-1', profile: null },
    target: { id: 'user-1', profile: null },
    ...overrides,
  })

  describe('toResponseView', () => {
    it('resolves both the actor and target as user references', () => {
      const log = baseLog({ actor: { id: 'mod-1', profile: null }, target: { id: 'user-1', profile: null } })

      const view = presenter.toResponseView(log)

      expect(view.actor).toMatchObject({ id: 'mod-1' })
      expect(view.target).toMatchObject({ id: 'user-1' })
    })

    it('returns a null target for actions with no target user, such as settings updates', () => {
      const log = baseLog({ type: NestActionType.SETTINGS_UPDATED, target: null, data: {} })

      const view = presenter.toResponseView(log)

      expect(view.target).toBeNull()
    })

    it('merges the action type into the data payload', () => {
      const log = baseLog({ type: NestActionType.MEMBER_REMOVED, data: { reason: 'Inactive' } })

      const view = presenter.toResponseView(log)

      expect(view.data).toEqual({ type: NestActionType.MEMBER_REMOVED, reason: 'Inactive' })
    })
  })
})
