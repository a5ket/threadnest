import { Injectable } from '@nestjs/common'
import { ReportStatus } from 'generated/prisma/enums'
import { CommentRepository } from 'src/comment/comment.repository'
import { NestRepository } from 'src/nest/nest.repository'
import { ThreadPolicy } from 'src/thread/thread.policy'
import { ThreadService } from 'src/thread/thread.service'
import { AlreadyReportedException } from './exceptions/already-reported.exception'
import { ReportCreateDto } from './dto/report-create.dto'
import { ReportPolicy } from './report.policy'
import { ReportPresenter } from './report.presenter'
import { ReportRepository } from './report.repository'

@Injectable()
export class ReportService {
  constructor(
    private readonly reportsRepo: ReportRepository,
    private readonly nestsRepo: NestRepository,
    private readonly threadsService: ThreadService,
    private readonly threadsPolicy: ThreadPolicy,
    private readonly commentsRepo: CommentRepository,
    private readonly policy: ReportPolicy,
    private readonly presenter: ReportPresenter,
  ) { }

  async reportThread(nestSlug: string, threadSlug: string, actorUserId: string, dto: ReportCreateDto) {
    const thread = await this.threadsService.getByNestSlug(nestSlug, threadSlug, actorUserId)

    await this.threadsPolicy.assertCanReadThread(thread, actorUserId)

    if (await this.reportsRepo.hasPendingReportForThread(thread.id, actorUserId)) {
      throw new AlreadyReportedException()
    }

    const report = await this.reportsRepo.createForThread(thread.nestId, thread.id, actorUserId, dto.reason, dto.details)

    return this.presenter.toSummaryView(report)
  }

  async reportComment(commentId: string, actorUserId: string, dto: ReportCreateDto) {
    const comment = await this.commentsRepo.getById(commentId)
    const thread = await this.threadsService.getById(comment.threadId)

    await this.threadsPolicy.assertCanReadThread(thread, actorUserId)

    if (await this.reportsRepo.hasPendingReportForComment(commentId, actorUserId)) {
      throw new AlreadyReportedException()
    }

    const report = await this.reportsRepo.createForComment(thread.nestId, commentId, actorUserId, dto.reason, dto.details)

    return this.presenter.toSummaryView(report)
  }

  async listQueue(nestSlug: string, actorUserId: string, status?: ReportStatus) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanListQueue(nest.id, actorUserId)

    const reports = await this.reportsRepo.listByNest(nest.id, status)

    return reports.map((report) => this.presenter.toSummaryView(report))
  }

  async resolve(nestSlug: string, reportId: string, actorUserId: string) {
    await this.setStatus(nestSlug, reportId, actorUserId, ReportStatus.RESOLVED)
  }

  async dismiss(nestSlug: string, reportId: string, actorUserId: string) {
    await this.setStatus(nestSlug, reportId, actorUserId, ReportStatus.DISMISSED)
  }

  private async setStatus(nestSlug: string, reportId: string, actorUserId: string, status: ReportStatus) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)
    const report = await this.reportsRepo.get(reportId, nest.id)

    await this.policy.assertCanReview(report, nest.id, actorUserId)

    await this.reportsRepo.updateStatus(reportId, status, actorUserId)
  }
}
