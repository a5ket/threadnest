import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { UserUnbannedEvent } from 'src/nest/ban/events/user-unbanned.event'
import { UserUnbannedActionLogSubscriber } from './user-unbanned.subscriber'

describe('UserUnbannedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new UserUnbannedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the unban', async () => {
    await subscriber.handle(new UserUnbannedEvent({
      nestId: 'nest-1',
      userId: 'banned-1',
      unbannedById: 'moderator-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'moderator-1', 'banned-1', NestActionType.MEMBER_UNBANNED, {})
  })
})
