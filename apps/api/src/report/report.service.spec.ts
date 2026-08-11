import { ReportReason, ReportStatus } from 'generated/prisma/enums'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { createComment } from 'test/factories/comment.factory'
import { createMockCommentRepository } from 'test/factories/comment-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createMockReportPolicy } from 'test/factories/report-policy.mock-factory'
import { createMockReportPresenter } from 'test/factories/report-presenter.mock-factory'
import { createMockReportRepository } from 'test/factories/report-repository.mock-factory'
import { createReportSummary } from 'test/factories/report-summary.factory'
import { createThreadDetails } from 'test/factories/thread-details.factory'
import { createMockThreadPolicy } from 'test/factories/thread-policy.mock-factory'
import { createMockThreadService } from 'test/factories/thread-service.mock-factory'
import { AlreadyReportedException } from './exceptions/already-reported.exception'
import { ReportService } from './report.service'

describe('ReportService', () => {
  const reportsRepo = createMockReportRepository()
  const nestsRepo = createMockNestRepository()
  const threadsService = createMockThreadService()
  const threadsPolicy = createMockThreadPolicy()
  const commentsRepo = createMockCommentRepository()
  const policy = createMockReportPolicy()
  const presenter = createMockReportPresenter()

  const service = new ReportService(
    reportsRepo as any,
    nestsRepo as any,
    threadsService as any,
    threadsPolicy as any,
    commentsRepo as any,
    policy as any,
    presenter as any,
  )

  const dto = { reason: ReportReason.SPAM, details: 'looks like spam' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('reportThread', () => {
    it('creates a report once the thread is readable and unreported', async () => {
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const report = createReportSummary()
      const view = { id: 'view-1' }

      threadsService.getByNestSlug.mockResolvedValue(thread)
      threadsPolicy.assertCanReadThread.mockResolvedValue({} as any)
      reportsRepo.hasPendingReportForThread.mockResolvedValue(false)
      reportsRepo.createForThread.mockResolvedValue(report)
      presenter.toSummaryView.mockReturnValue(view as any)

      const result = await service.reportThread('nest-slug', 'thread-slug', 'actor-1', dto)

      expect(threadsService.getByNestSlug).toHaveBeenCalledWith('nest-slug', 'thread-slug', 'actor-1')
      expect(threadsPolicy.assertCanReadThread).toHaveBeenCalledWith(thread, 'actor-1')
      expect(reportsRepo.createForThread).toHaveBeenCalledWith('nest-1', 'thread-1', 'actor-1', dto.reason, dto.details)
      expect(result).toBe(view)
    })

    it('propagates the visibility check failure and never creates a report', async () => {
      const thread = createThreadDetails()

      threadsService.getByNestSlug.mockResolvedValue(thread)
      threadsPolicy.assertCanReadThread.mockRejectedValue(new ThreadNotFoundException())

      await expect(
        service.reportThread('nest-slug', 'thread-slug', 'actor-1', dto),
      ).rejects.toThrow(ThreadNotFoundException)

      expect(reportsRepo.hasPendingReportForThread).not.toHaveBeenCalled()
      expect(reportsRepo.createForThread).not.toHaveBeenCalled()
    })

    it('throws AlreadyReportedException when the actor already has a pending report and never creates another', async () => {
      const thread = createThreadDetails()

      threadsService.getByNestSlug.mockResolvedValue(thread)
      threadsPolicy.assertCanReadThread.mockResolvedValue({} as any)
      reportsRepo.hasPendingReportForThread.mockResolvedValue(true)

      await expect(
        service.reportThread('nest-slug', 'thread-slug', 'actor-1', dto),
      ).rejects.toThrow(AlreadyReportedException)

      expect(reportsRepo.createForThread).not.toHaveBeenCalled()
    })
  })

  describe('reportComment', () => {
    it('resolves the parent thread and creates a report once readable and unreported', async () => {
      const comment = createComment({ id: 'comment-1', threadId: 'thread-1' })
      const thread = createThreadDetails({ id: 'thread-1', nestId: 'nest-1' })
      const report = createReportSummary()
      const view = { id: 'view-1' }

      commentsRepo.getById.mockResolvedValue(comment)
      threadsService.getById.mockResolvedValue(thread)
      threadsPolicy.assertCanReadThread.mockResolvedValue({} as any)
      reportsRepo.hasPendingReportForComment.mockResolvedValue(false)
      reportsRepo.createForComment.mockResolvedValue(report)
      presenter.toSummaryView.mockReturnValue(view as any)

      const result = await service.reportComment('comment-1', 'actor-1', dto)

      expect(threadsService.getById).toHaveBeenCalledWith('thread-1')
      expect(threadsPolicy.assertCanReadThread).toHaveBeenCalledWith(thread, 'actor-1')
      expect(reportsRepo.createForComment).toHaveBeenCalledWith('nest-1', 'comment-1', 'actor-1', dto.reason, dto.details)
      expect(result).toBe(view)
    })

    it('propagates the visibility check failure and never creates a report', async () => {
      const comment = createComment({ threadId: 'thread-1' })
      const thread = createThreadDetails()

      commentsRepo.getById.mockResolvedValue(comment)
      threadsService.getById.mockResolvedValue(thread)
      threadsPolicy.assertCanReadThread.mockRejectedValue(new ThreadNotFoundException())

      await expect(
        service.reportComment('comment-1', 'actor-1', dto),
      ).rejects.toThrow(ThreadNotFoundException)

      expect(reportsRepo.hasPendingReportForComment).not.toHaveBeenCalled()
      expect(reportsRepo.createForComment).not.toHaveBeenCalled()
    })

    it('throws AlreadyReportedException when the actor already has a pending report and never creates another', async () => {
      const comment = createComment({ threadId: 'thread-1' })
      const thread = createThreadDetails()

      commentsRepo.getById.mockResolvedValue(comment)
      threadsService.getById.mockResolvedValue(thread)
      threadsPolicy.assertCanReadThread.mockResolvedValue({} as any)
      reportsRepo.hasPendingReportForComment.mockResolvedValue(true)

      await expect(
        service.reportComment('comment-1', 'actor-1', dto),
      ).rejects.toThrow(AlreadyReportedException)

      expect(reportsRepo.createForComment).not.toHaveBeenCalled()
    })
  })

  describe('listQueue', () => {
    it('lists reports for the nest once the actor is allowed to moderate', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const reports = [createReportSummary({ id: 'report-1' }), createReportSummary({ id: 'report-2' })]
      const view = { id: 'view' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      policy.assertCanListQueue.mockResolvedValue(undefined)
      reportsRepo.listByNest.mockResolvedValue(reports)
      presenter.toSummaryView.mockReturnValue(view as any)

      const result = await service.listQueue('nest-slug', 'actor-1', ReportStatus.PENDING)

      expect(policy.assertCanListQueue).toHaveBeenCalledWith('nest-1', 'actor-1')
      expect(reportsRepo.listByNest).toHaveBeenCalledWith('nest-1', ReportStatus.PENDING)
      expect(presenter.toSummaryView).toHaveBeenCalledTimes(2)
      expect(result).toEqual([view, view])
    })

    it('propagates the permission failure and never queries reports', async () => {
      const nest = createNestSummary()

      nestsRepo.getBySlug.mockResolvedValue(nest)
      policy.assertCanListQueue.mockRejectedValue(new Error('forbidden'))

      await expect(
        service.listQueue('nest-slug', 'actor-1'),
      ).rejects.toThrow('forbidden')

      expect(reportsRepo.listByNest).not.toHaveBeenCalled()
    })
  })

  describe('resolve', () => {
    it('fetches the report, checks it can be reviewed, and marks it resolved', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const report = createReportSummary({ id: 'report-1', status: ReportStatus.PENDING })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      reportsRepo.get.mockResolvedValue(report)
      policy.assertCanReview.mockResolvedValue(undefined)

      await service.resolve('nest-slug', 'report-1', 'actor-1')

      expect(reportsRepo.get).toHaveBeenCalledWith('report-1', 'nest-1')
      expect(policy.assertCanReview).toHaveBeenCalledWith(report, 'nest-1', 'actor-1')
      expect(reportsRepo.updateStatus).toHaveBeenCalledWith('report-1', ReportStatus.RESOLVED, 'actor-1')
    })

    it('propagates the review check failure and never updates the report', async () => {
      const nest = createNestSummary()
      const report = createReportSummary({ status: ReportStatus.RESOLVED })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      reportsRepo.get.mockResolvedValue(report)
      policy.assertCanReview.mockRejectedValue(new Error('already resolved'))

      await expect(
        service.resolve('nest-slug', 'report-1', 'actor-1'),
      ).rejects.toThrow('already resolved')

      expect(reportsRepo.updateStatus).not.toHaveBeenCalled()
    })
  })

  describe('dismiss', () => {
    it('fetches the report, checks it can be reviewed, and marks it dismissed', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const report = createReportSummary({ id: 'report-1', status: ReportStatus.PENDING })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      reportsRepo.get.mockResolvedValue(report)
      policy.assertCanReview.mockResolvedValue(undefined)

      await service.dismiss('nest-slug', 'report-1', 'actor-1')

      expect(reportsRepo.updateStatus).toHaveBeenCalledWith('report-1', ReportStatus.DISMISSED, 'actor-1')
    })

    it('propagates the review check failure and never updates the report', async () => {
      const nest = createNestSummary()
      const report = createReportSummary({ status: ReportStatus.DISMISSED })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      reportsRepo.get.mockResolvedValue(report)
      policy.assertCanReview.mockRejectedValue(new Error('already resolved'))

      await expect(
        service.dismiss('nest-slug', 'report-1', 'actor-1'),
      ).rejects.toThrow('already resolved')

      expect(reportsRepo.updateStatus).not.toHaveBeenCalled()
    })
  })
})
