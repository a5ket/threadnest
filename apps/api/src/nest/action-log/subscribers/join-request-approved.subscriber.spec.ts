import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { NestJoinRequestApprovedEvent } from 'src/nest/join-request/events/nest-join-request-approved.event'
import { JoinRequestApprovedActionLogSubscriber } from './join-request-approved.subscriber'

describe('JoinRequestApprovedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new JoinRequestApprovedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the approval', async () => {
    await subscriber.handle(new NestJoinRequestApprovedEvent({
      requestId: 'request-1',
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      userId: 'requester-1',
      approvedById: 'approver-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'approver-1', 'requester-1', NestActionType.JOIN_REQUEST_APPROVED, {})
  })
})
