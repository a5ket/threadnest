import { PlatformActionType } from 'generated/prisma/enums'
import { createMockPlatformActionLogPolicy } from 'test/factories/platform-action-log-policy.mock-factory'
import { createMockPlatformActionLogPresenter } from 'test/factories/platform-action-log-presenter.mock-factory'
import { createMockPlatformActionLogRepository } from 'test/factories/platform-action-log-repository.mock-factory'
import { createPlatformActionLogSummary } from 'test/factories/platform-action-log-summary.factory'
import { PlatformActionLogService } from './platform-action-log.service'

describe('PlatformActionLogService', () => {
  const actionLogsRepo = createMockPlatformActionLogRepository()
  const presenter = createMockPlatformActionLogPresenter()
  const policy = createMockPlatformActionLogPolicy()

  const service = new PlatformActionLogService(
    actionLogsRepo as any,
    presenter as any,
    policy as any,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('creates the log entry and presents it', async () => {
      const log = createPlatformActionLogSummary()
      const view = { id: 'view-1' }

      actionLogsRepo.create.mockResolvedValue(log)
      presenter.toResponseView.mockReturnValue(view as any)

      const result = await service.create('actor-1', 'target-1', null, PlatformActionType.USER_SUSPENDED, { reason: 'spam' })

      expect(actionLogsRepo.create).toHaveBeenCalledWith('actor-1', 'target-1', null, PlatformActionType.USER_SUSPENDED, { reason: 'spam' })
      expect(presenter.toResponseView).toHaveBeenCalledWith(log)
      expect(result).toBe(view)
    })
  })

  describe('list', () => {
    it('checks the policy and presents the page', async () => {
      const logs = [createPlatformActionLogSummary({ id: 'log-1' }), createPlatformActionLogSummary({ id: 'log-2' })]
      const view = { id: 'view' }
      const query = { limit: 20 }

      policy.assertCanViewActionLog.mockResolvedValue(undefined)
      actionLogsRepo.list.mockResolvedValue({ items: logs, meta: { nextCursor: 'cursor-1', hasMore: true } })
      presenter.toResponseView.mockReturnValue(view as any)

      const result = await service.list('actor-1', query)

      expect(policy.assertCanViewActionLog).toHaveBeenCalledWith('actor-1')
      expect(actionLogsRepo.list).toHaveBeenCalledWith(query)
      expect(presenter.toResponseView).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ items: [view, view], meta: { nextCursor: 'cursor-1', hasMore: true } })
    })

    it('propagates the permission failure and never queries logs', async () => {
      policy.assertCanViewActionLog.mockRejectedValue(new Error('forbidden'))

      await expect(
        service.list('actor-1', { limit: 20 }),
      ).rejects.toThrow('forbidden')

      expect(actionLogsRepo.list).not.toHaveBeenCalled()
    })
  })
})
