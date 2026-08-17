import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogPolicy } from 'test/factories/nest-action-log-policy.mock-factory'
import { createMockNestActionLogPresenter } from 'test/factories/nest-action-log-presenter.mock-factory'
import { createMockNestActionLogRepository } from 'test/factories/nest-action-log-repository.mock-factory'
import { createNestActionLogSummary } from 'test/factories/nest-action-log-summary.factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { NestActionLogService } from './nest-action-log.service'

describe('NestActionLogService', () => {
  const actionLogsRepo = createMockNestActionLogRepository()
  const presenter = createMockNestActionLogPresenter()
  const policy = createMockNestActionLogPolicy()
  const nestsRepo = createMockNestRepository()

  const service = new NestActionLogService(
    actionLogsRepo as any,
    presenter,
    policy as any,
    nestsRepo as any,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('creates the log entry and presents it', async () => {
      const log = createNestActionLogSummary()
      const view = { id: 'view-1' }

      actionLogsRepo.create.mockResolvedValue(log)
      presenter.toResponseView.mockReturnValue(view as any)

      const result = await service.create('nest-1', 'actor-1', 'target-1', NestActionType.MEMBER_BANNED, { reason: 'spam' })

      expect(actionLogsRepo.create).toHaveBeenCalledWith('nest-1', 'actor-1', 'target-1', NestActionType.MEMBER_BANNED, { reason: 'spam' })
      expect(presenter.toResponseView).toHaveBeenCalledWith(log)
      expect(result).toBe(view)
    })
  })

  describe('listByNest', () => {
    it('resolves the nest, checks the policy, and presents the page', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const logs = [createNestActionLogSummary({ id: 'log-1' }), createNestActionLogSummary({ id: 'log-2' })]
      const view = { id: 'view' }
      const query = { limit: 20 }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      policy.assertCanViewActionLog.mockResolvedValue(undefined)
      actionLogsRepo.listByNest.mockResolvedValue({ items: logs, meta: { nextCursor: 'cursor-1', hasMore: true } })
      presenter.toResponseView.mockReturnValue(view as any)

      const result = await service.listByNest('nest-slug', 'actor-1', query)

      expect(policy.assertCanViewActionLog).toHaveBeenCalledWith('nest-1', 'actor-1')
      expect(actionLogsRepo.listByNest).toHaveBeenCalledWith('nest-1', query)
      expect(presenter.toResponseView).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ items: [view, view], meta: { nextCursor: 'cursor-1', hasMore: true } })
    })

    it('propagates the permission failure and never queries logs', async () => {
      const nest = createNestSummary({ id: 'nest-1' })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      policy.assertCanViewActionLog.mockRejectedValue(new Error('forbidden'))

      await expect(
        service.listByNest('nest-slug', 'actor-1', { limit: 20 }),
      ).rejects.toThrow('forbidden')

      expect(actionLogsRepo.listByNest).not.toHaveBeenCalled()
    })
  })
})
