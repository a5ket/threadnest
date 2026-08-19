import { PlatformActionType } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformRoleRevokedEvent } from '../../events/platform-role-revoked.event'
import { PlatformRoleRevokedActionLogSubscriber } from './role-revoked.subscriber'

describe('PlatformRoleRevokedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformRoleRevokedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the revocation', async () => {
    await subscriber.handle(new PlatformRoleRevokedEvent({
      userId: 'user-1',
      revokedById: 'admin-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('admin-1', 'user-1', null, PlatformActionType.ROLE_REVOKED, {})
  })
})
