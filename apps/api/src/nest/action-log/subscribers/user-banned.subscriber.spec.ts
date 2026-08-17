import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { UserBannedEvent } from 'src/nest/ban/events/user-banned.event'
import { UserBannedActionLogSubscriber } from './user-banned.subscriber'

describe('UserBannedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new UserBannedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the ban', async () => {
    await subscriber.handle(new UserBannedEvent({
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      userId: 'banned-1',
      bannedById: 'moderator-1',
      reason: 'spam'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'moderator-1', 'banned-1', NestActionType.MEMBER_BANNED, {
      reason: 'spam'
    })
  })
})
