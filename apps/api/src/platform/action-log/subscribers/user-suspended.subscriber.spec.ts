import { PlatformActionType } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformUserSuspendedEvent } from '../../events/platform-user-suspended.event'
import { PlatformUserSuspendedActionLogSubscriber } from './user-suspended.subscriber'

describe('PlatformUserSuspendedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformUserSuspendedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the suspension', async () => {
    await subscriber.handle(new PlatformUserSuspendedEvent({
      userId: 'user-1',
      reason: 'spam',
      suspendedById: 'mod-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('mod-1', 'user-1', null, PlatformActionType.USER_SUSPENDED, {
      reason: 'spam'
    })
  })
})
