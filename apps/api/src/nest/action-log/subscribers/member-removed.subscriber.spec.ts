import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { MemberRemovedEvent } from 'src/nest/member/events/member-removed.event'
import { MemberRemovedActionLogSubscriber } from './member-removed.subscriber'

describe('MemberRemovedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new MemberRemovedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the removal', async () => {
    await subscriber.handle(new MemberRemovedEvent({
      nestId: 'nest-1',
      actorUserId: 'actor-1',
      targetUserId: 'target-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'actor-1', 'target-1', NestActionType.MEMBER_REMOVED, {})
  })
})
