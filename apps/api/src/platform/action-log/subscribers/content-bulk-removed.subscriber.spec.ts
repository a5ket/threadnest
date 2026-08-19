import { PlatformActionType } from 'generated/prisma/enums'
import { createMockPlatformActionLogService } from 'test/factories/platform-action-log-service.mock-factory'
import { PlatformContentBulkRemovedEvent } from '../../events/platform-content-bulk-removed.event'
import { PlatformContentBulkRemovedActionLogSubscriber } from './content-bulk-removed.subscriber'

describe('PlatformContentBulkRemovedActionLogSubscriber', () => {
  const actionLogs = createMockPlatformActionLogService()
  const subscriber = new PlatformContentBulkRemovedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the bulk removal', async () => {
    await subscriber.handle(new PlatformContentBulkRemovedEvent({
      userId: 'user-1',
      threadsRemoved: 3,
      commentsRemoved: 7,
      removedById: 'mod-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('mod-1', 'user-1', null, PlatformActionType.CONTENT_BULK_REMOVED, {
      threadsRemoved: 3,
      commentsRemoved: 7
    })
  })
})
