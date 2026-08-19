import { PlatformActionType, PlatformRole } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformRoleGrantedEvent } from '../../events/platform-role-granted.event'
import { PlatformRoleGrantedActionLogSubscriber } from './role-granted.subscriber'

describe('PlatformRoleGrantedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformRoleGrantedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the grant', async () => {
    await subscriber.handle(new PlatformRoleGrantedEvent({
      userId: 'user-1',
      role: PlatformRole.MODERATOR,
      grantedById: 'admin-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('admin-1', 'user-1', null, PlatformActionType.ROLE_GRANTED, {
      role: PlatformRole.MODERATOR
    })
  })
})
