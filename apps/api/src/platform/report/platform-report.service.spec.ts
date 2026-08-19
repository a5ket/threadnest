import { PlatformReportReason, PlatformReportStatus, PlatformReportTargetType } from 'generated/prisma/enums'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockPlatformReportPolicy } from 'test/factories/platform-report-policy.mock-factory'
import { createMockPlatformReportPresenter } from 'test/factories/platform-report-presenter.mock-factory'
import { createMockPlatformReportRepository } from 'test/factories/platform-report-repository.mock-factory'
import { createPlatformReportSummary } from 'test/factories/platform-report-summary.factory'
import { AlreadyReportedToPlatformException } from './exceptions/already-reported-to-platform.exception'
import { PlatformReportTargetNotFoundException } from './exceptions/platform-report-target-not-found.exception'
import { PlatformReportService } from './platform-report.service'

describe('PlatformReportService', () => {
  const reportsRepo = createMockPlatformReportRepository()
  const policy = createMockPlatformReportPolicy()
  const presenter = createMockPlatformReportPresenter()
  const eventBus = createMockEventBus()

  const service = new PlatformReportService(reportsRepo as any, policy as any, presenter as any, eventBus)

  const dto = { targetType: PlatformReportTargetType.THREAD, targetId: 'thread-1', reason: PlatformReportReason.SPAM_NETWORK, details: 'looks like spam' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('report', () => {
    it('creates a report once the target exists and is unreported', async () => {
      const report = createPlatformReportSummary()
      const view = { id: 'view-1' }

      reportsRepo.targetExists.mockResolvedValue(true)
      reportsRepo.hasPendingReport.mockResolvedValue(false)
      reportsRepo.create.mockResolvedValue(report)
      presenter.toSummaryView.mockReturnValue(view as any)

      const result = await service.report('actor-1', dto)

      expect(reportsRepo.targetExists).toHaveBeenCalledWith(dto.targetType, dto.targetId)
      expect(reportsRepo.hasPendingReport).toHaveBeenCalledWith(dto.targetType, dto.targetId, 'actor-1')
      expect(reportsRepo.create).toHaveBeenCalledWith('actor-1', dto)
      expect(result).toBe(view)
    })

    it('throws PlatformReportTargetNotFoundException when the target does not exist and never creates a report', async () => {
      reportsRepo.targetExists.mockResolvedValue(false)

      await expect(service.report('actor-1', dto)).rejects.toThrow(PlatformReportTargetNotFoundException)

      expect(reportsRepo.hasPendingReport).not.toHaveBeenCalled()
      expect(reportsRepo.create).not.toHaveBeenCalled()
    })

    it('throws AlreadyReportedToPlatformException when the actor already has a pending report and never creates another', async () => {
      reportsRepo.targetExists.mockResolvedValue(true)
      reportsRepo.hasPendingReport.mockResolvedValue(true)

      await expect(service.report('actor-1', dto)).rejects.toThrow(AlreadyReportedToPlatformException)

      expect(reportsRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('listQueue', () => {
    it('lists reports once the actor is a moderator', async () => {
      const reports = [createPlatformReportSummary({ id: 'report-1' }), createPlatformReportSummary({ id: 'report-2' })]
      const view = { id: 'view' }

      policy.assertIsModerator.mockResolvedValue(undefined)
      reportsRepo.list.mockResolvedValue(reports)
      presenter.toSummaryView.mockReturnValue(view as any)

      const result = await service.listQueue('actor-1', PlatformReportStatus.PENDING)

      expect(policy.assertIsModerator).toHaveBeenCalledWith('actor-1')
      expect(reportsRepo.list).toHaveBeenCalledWith(PlatformReportStatus.PENDING)
      expect(presenter.toSummaryView).toHaveBeenCalledTimes(2)
      expect(result).toEqual([view, view])
    })

    it('propagates the permission failure and never queries reports', async () => {
      policy.assertIsModerator.mockRejectedValue(new Error('forbidden'))

      await expect(service.listQueue('actor-1')).rejects.toThrow('forbidden')

      expect(reportsRepo.list).not.toHaveBeenCalled()
    })
  })

  describe('resolve', () => {
    it('fetches the report, checks it can be reviewed, and marks it resolved', async () => {
      const report = createPlatformReportSummary({ id: 'report-1', status: PlatformReportStatus.PENDING })

      policy.assertIsModerator.mockResolvedValue(undefined)
      reportsRepo.get.mockResolvedValue(report)
      policy.assertCanReview.mockReturnValue(undefined)

      await service.resolve('report-1', 'actor-1')

      expect(reportsRepo.get).toHaveBeenCalledWith('report-1')
      expect(policy.assertCanReview).toHaveBeenCalledWith(report)
      expect(reportsRepo.updateStatus).toHaveBeenCalledWith('report-1', PlatformReportStatus.RESOLVED, 'actor-1')
    })

    it('propagates the permission failure and never fetches the report', async () => {
      policy.assertIsModerator.mockRejectedValue(new Error('forbidden'))

      await expect(service.resolve('report-1', 'actor-1')).rejects.toThrow('forbidden')

      expect(reportsRepo.get).not.toHaveBeenCalled()
      expect(reportsRepo.updateStatus).not.toHaveBeenCalled()
    })

    it('propagates the review check failure and never updates the report', async () => {
      const report = createPlatformReportSummary({ status: PlatformReportStatus.RESOLVED })

      policy.assertIsModerator.mockResolvedValue(undefined)
      reportsRepo.get.mockResolvedValue(report)
      policy.assertCanReview.mockImplementationOnce(() => { throw new Error('already resolved') })

      await expect(service.resolve('report-1', 'actor-1')).rejects.toThrow('already resolved')

      expect(reportsRepo.updateStatus).not.toHaveBeenCalled()
    })
  })

  describe('dismiss', () => {
    it('fetches the report, checks it can be reviewed, and marks it dismissed', async () => {
      const report = createPlatformReportSummary({ id: 'report-1', status: PlatformReportStatus.PENDING })

      policy.assertIsModerator.mockResolvedValue(undefined)
      reportsRepo.get.mockResolvedValue(report)
      policy.assertCanReview.mockReturnValue(undefined)

      await service.dismiss('report-1', 'actor-1')

      expect(reportsRepo.updateStatus).toHaveBeenCalledWith('report-1', PlatformReportStatus.DISMISSED, 'actor-1')
    })
  })
})
