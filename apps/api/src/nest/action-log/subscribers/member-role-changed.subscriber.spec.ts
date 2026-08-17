import { NestActionType, NestMemberRole } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { MemberRoleChangedEvent } from 'src/nest/member/events/member-role-changed.event'
import { MemberRoleChangedActionLogSubscriber } from './member-role-changed.subscriber'

describe('MemberRoleChangedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new MemberRoleChangedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the role change', async () => {
    await subscriber.handle(new MemberRoleChangedEvent({
      nestId: 'nest-1',
      actorUserId: 'actor-1',
      targetUserId: 'target-1',
      newRole: NestMemberRole.MODERATOR
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'actor-1', 'target-1', NestActionType.MEMBER_ROLE_CHANGED, {
      newRole: NestMemberRole.MODERATOR
    })
  })
})
