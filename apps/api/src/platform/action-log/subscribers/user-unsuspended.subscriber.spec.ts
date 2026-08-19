import { PlatformActionType } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformUserUnsuspendedEvent } from '../../events/platform-user-unsuspended.event'
import { PlatformUserUnsuspendedActionLogSubscriber } from './user-unsuspended.subscriber'

describe('PlatformUserUnsuspendedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformUserUnsuspendedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the unsuspension', async () => {
    await subscriber.handle(new PlatformUserUnsuspendedEvent({
      userId: 'user-1',
      unsuspendedById: 'mod-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('mod-1', 'user-1', null, PlatformActionType.USER_UNSUSPENDED, {})
  })
})
