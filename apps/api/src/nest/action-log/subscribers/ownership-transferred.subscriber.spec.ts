import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { OwnershipTransferredEvent } from 'src/nest/events/ownership-transferred.event'
import { OwnershipTransferredActionLogSubscriber } from './ownership-transferred.subscriber'

describe('OwnershipTransferredActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new OwnershipTransferredActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the transfer', async () => {
    await subscriber.handle(new OwnershipTransferredEvent({
      nestId: 'nest-1',
      nestSlug: 'nest-slug',
      nestName: 'Nest',
      previousOwnerId: 'old-owner-1',
      newOwnerId: 'new-owner-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'old-owner-1', 'new-owner-1', NestActionType.OWNERSHIP_TRANSFERRED, {})
  })
})
