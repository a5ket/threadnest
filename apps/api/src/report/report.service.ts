import { Injectable } from '@nestjs/common'
import { ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { PinoLogger } from 'nestjs-pino'
import { CommentRepository } from 'src/comment/comment.repository'
import { EventBus } from 'src/event/event-bus'
import { NestRepository } from 'src/nest/nest.repository'
import { ThreadAccess } from 'src/thread/thread.access'
import { ThreadService } from 'src/thread/thread.service'
import { AlreadyReportedException } from './exceptions/already-reported.exception'
import { ReportResolvedEvent } from './events/report-resolved.event'
import { ReportCreateDto } from './dto/report-create.dto'
import { ReportPolicy } from './report.policy'
import { ReportPresenter } from './report.presenter'
import { ReportRepository } from './report.repository'

/**
 * Nest-level content moderation reports: any nest member can report a thread or comment, nest
 * moderators triage the queue. Distinct from {@link PlatformReportService}, which covers
 * platform-wide reports (nests, users, threads, comments, messages) reviewed by platform staff.
 */
@Injectable()
export class ReportService {
  constructor(
    private readonly reportsRepo: ReportRepository,
    private readonly nestsRepo: NestRepository,
    private readonly threadsService: ThreadService,
    private readonly threadAccess: ThreadAccess,
    private readonly commentsRepo: CommentRepository,
    private readonly policy: ReportPolicy,
    private readonly presenter: ReportPresenter,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(ReportService.name)
  }

  /**
   * @param nestSlug - The nest the thread belongs to.
   * @param threadSlug - The thread to report.
   * @param actorUserId - The reporter.
   * @param dto - The report reason and optional details.
   * @returns The new report's summary view.
   * @throws {ThreadNotFoundException} The thread isn't visible to the reporter.
   * @throws {AlreadyReportedException} `actorUserId` already has a pending report against this thread.
   */
  async reportThread(nestSlug: string, threadSlug: string, actorUserId: string, dto: ReportCreateDto) {
    const thread = await this.threadsService.getByNestSlug(nestSlug, threadSlug, actorUserId)
    const threadCtx = await this.threadAccess.getContext(thread, actorUserId)

    this.policy.assertCanReportThread(threadCtx)

    if (await this.reportsRepo.hasPendingReportForThread(thread.id, actorUserId)) {
      throw new AlreadyReportedException()
    }

    const report = await this.reportsRepo.createForThread(thread.nestId, thread.id, actorUserId, dto.reason, dto.details)

    return this.presenter.toSummaryView(report)
  }

  /**
   * @param commentId - The comment to report.
   * @param actorUserId - The reporter.
   * @param dto - The report reason and optional details.
   * @returns The new report's summary view.
   * @throws {CommentNotFoundException} No comment with this id.
   * @throws {ThreadNotFoundException} The comment's thread isn't visible to the reporter.
   * @throws {AlreadyReportedException} `actorUserId` already has a pending report against this comment.
   */
  async reportComment(commentId: string, actorUserId: string, dto: ReportCreateDto) {
    const comment = await this.commentsRepo.getById(commentId)
    const thread = await this.threadsService.getById(comment.threadId)
    const threadCtx = await this.threadAccess.getContext(thread, actorUserId)

    this.policy.assertCanReportThread(threadCtx)

    if (await this.reportsRepo.hasPendingReportForComment(commentId, actorUserId)) {
      throw new AlreadyReportedException()
    }

    const report = await this.reportsRepo.createForComment(thread.nestId, commentId, actorUserId, dto.reason, dto.details)

    return this.presenter.toSummaryView(report)
  }

  /**
   * @param nestSlug - The nest whose report queue to list.
   * @param actorUserId - The moderator viewing the queue.
   * @param status - Filter to only this status, or omit to list every report.
   * @returns Matching reports' summary views, newest first.
   * @throws {NestNotFoundException} No nest with this slug.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a moderator in this nest.
   */
  async listQueue(nestSlug: string, actorUserId: string, status?: ReportStatus) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanListQueue(nest.id, actorUserId)

    const reports = await this.reportsRepo.listByNest(nest.id, status)

    return reports.map((report) => this.presenter.toSummaryView(report))
  }

  /**
   * Marks a report resolved — the reporter's concern was acted on (e.g. content removed).
   *
   * @param nestSlug - The nest the report belongs to.
   * @param reportId - The report to resolve.
   * @param actorUserId - The moderator reviewing it.
   * @throws {NestNotFoundException} No nest with this slug.
   * @throws {ReportNotFoundException} No report with this id in this nest.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a moderator in this nest.
   * @throws {ReportAlreadyResolvedException} Already resolved or dismissed.
   */
  async resolve(nestSlug: string, reportId: string, actorUserId: string) {
    await this.setStatus(nestSlug, reportId, actorUserId, ReportStatus.RESOLVED)
  }

  /**
   * Marks a report dismissed — reviewed, but no action taken.
   *
   * @param nestSlug - The nest the report belongs to.
   * @param reportId - The report to dismiss.
   * @param actorUserId - The moderator reviewing it.
   * @throws {NestNotFoundException} No nest with this slug.
   * @throws {ReportNotFoundException} No report with this id in this nest.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a moderator in this nest.
   * @throws {ReportAlreadyResolvedException} Already resolved or dismissed.
   */
  async dismiss(nestSlug: string, reportId: string, actorUserId: string) {
    await this.setStatus(nestSlug, reportId, actorUserId, ReportStatus.DISMISSED)
  }

  private async setStatus(nestSlug: string, reportId: string, actorUserId: string, status: Exclude<ReportStatus, 'PENDING'>) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)
    const report = await this.reportsRepo.get(reportId, nest.id)

    await this.policy.assertCanReview(report, nest.id, actorUserId)

    await this.reportsRepo.updateStatus(reportId, status, actorUserId)

    this.logger.info({ reportId, nestId: nest.id, actorUserId, status }, 'Report reviewed')

    // report.thread/report.comment are mutually exclusive based on targetType — see REPORT_SUMMARY_SELECT.
    const isThreadTarget = report.targetType === ReportTargetType.THREAD

    void this.eventBus.publish(new ReportResolvedEvent({
      reportId: report.id,
      nestId: nest.id,
      nestSlug: nest.slug,
      nestName: nest.name,
      reporterId: report.reporter.id,
      resolvedById: actorUserId,
      status,
      targetType: report.targetType,
      threadSlug: isThreadTarget ? report.thread!.slug : report.comment!.thread.slug,
      threadTitle: isThreadTarget ? report.thread!.title : report.comment!.thread.title,
      commentId: isThreadTarget ? null : report.comment!.id,
    }))
  }
}
