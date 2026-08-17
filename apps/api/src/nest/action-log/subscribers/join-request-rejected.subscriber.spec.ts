import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { NestJoinRequestRejectedEvent } from 'src/nest/join-request/events/nest-join-request-rejected.event'
import { JoinRequestRejectedActionLogSubscriber } from './join-request-rejected.subscriber'

describe('JoinRequestRejectedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new JoinRequestRejectedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the rejection', async () => {
    await subscriber.handle(new NestJoinRequestRejectedEvent({
      requestId: 'request-1',
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      userId: 'requester-1',
      rejectedById: 'rejector-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'rejector-1', 'requester-1', NestActionType.JOIN_REQUEST_REJECTED, {})
  })
})
