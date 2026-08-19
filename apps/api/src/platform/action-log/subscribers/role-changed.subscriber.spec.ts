import { PlatformActionType, PlatformRole } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformRoleChangedEvent } from '../../events/platform-role-changed.event'
import { PlatformRoleChangedActionLogSubscriber } from './role-changed.subscriber'

describe('PlatformRoleChangedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformRoleChangedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the change', async () => {
    await subscriber.handle(new PlatformRoleChangedEvent({
      userId: 'user-1',
      newRole: PlatformRole.ADMIN,
      changedById: 'admin-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('admin-1', 'user-1', null, PlatformActionType.ROLE_CHANGED, {
      newRole: PlatformRole.ADMIN
    })
  })
})
