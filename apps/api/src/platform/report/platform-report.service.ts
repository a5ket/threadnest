import { Injectable } from '@nestjs/common'
import { PlatformReportStatus } from 'generated/prisma/enums'
import { PinoLogger } from 'nestjs-pino'
import { EventBus } from 'src/event/event-bus'
import { PlatformReportCreateDto } from './dto/platform-report-create.dto'
import { PlatformReportReviewedEvent } from '../events/platform-report-reviewed.event'
import { AlreadyReportedToPlatformException } from './exceptions/already-reported-to-platform.exception'
import { PlatformReportTargetNotFoundException } from './exceptions/platform-report-target-not-found.exception'
import { PlatformReportPolicy } from './platform-report.policy'
import { PlatformReportPresenter } from './platform-report.presenter'
import { PlatformReportRepository } from './platform-report.repository'
import { PlatformReportSummary } from './types/platform-report.summary'

@Injectable()
export class PlatformReportService {
  constructor(
    private readonly reportsRepo: PlatformReportRepository,
    private readonly policy: PlatformReportPolicy,
    private readonly presenter: PlatformReportPresenter,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(PlatformReportService.name)
  }

  /**
   * Files a platform report. Any authenticated user can report anything they can see — no
   * moderator check here, since filing a report needs no special authority.
   *
   * @param actorUserId - The user filing the report.
   * @param dto - The target, reason, and optional details.
   * @returns The new report's summary view.
   * @throws {PlatformReportTargetNotFoundException} The target doesn't exist.
   * @throws {AlreadyReportedToPlatformException} `actorUserId` already has a pending report
   * against this same target.
   */
  async report(actorUserId: string, dto: PlatformReportCreateDto) {
    if (!(await this.reportsRepo.targetExists(dto.targetType, dto.targetId))) {
      throw new PlatformReportTargetNotFoundException()
    }

    if (await this.reportsRepo.hasPendingReport(dto.targetType, dto.targetId, actorUserId)) {
      throw new AlreadyReportedToPlatformException()
    }

    const report = await this.reportsRepo.create(actorUserId, dto)

    return this.presenter.toSummaryView(report)
  }

  /**
   * @param actorUserId - The moderator viewing the queue.
   * @param status - Filter to only this status, or omit to list every report.
   * @returns Matching reports' summary views, newest first.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform moderator or admin.
   */
  async listQueue(actorUserId: string, status?: PlatformReportStatus) {
    await this.policy.assertIsModerator(actorUserId)

    const reports = await this.reportsRepo.list(status)

    return reports.map((report) => this.presenter.toSummaryView(report))
  }

  /**
   * Marks a report resolved — the reporter's concern was acted on (e.g. content removed).
   *
   * @param reportId - The report to resolve.
   * @param actorUserId - The moderator reviewing it.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform moderator or admin.
   * @throws {PlatformReportNotFoundException} No report with this id.
   * @throws {PlatformReportAlreadyResolvedException} Already resolved or dismissed.
   */
  async resolve(reportId: string, actorUserId: string) {
    await this.setStatus(reportId, actorUserId, PlatformReportStatus.RESOLVED)
  }

  /**
   * Marks a report dismissed — reviewed, but no action taken.
   *
   * @param reportId - The report to dismiss.
   * @param actorUserId - The moderator reviewing it.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't a platform moderator or admin.
   * @throws {PlatformReportNotFoundException} No report with this id.
   * @throws {PlatformReportAlreadyResolvedException} Already resolved or dismissed.
   */
  async dismiss(reportId: string, actorUserId: string) {
    await this.setStatus(reportId, actorUserId, PlatformReportStatus.DISMISSED)
  }

  private async setStatus(reportId: string, actorUserId: string, status: Exclude<PlatformReportStatus, 'PENDING'>) {
    await this.policy.assertIsModerator(actorUserId)

    const report = await this.reportsRepo.get(reportId)

    this.policy.assertCanReview(report)

    await this.reportsRepo.updateStatus(reportId, status, actorUserId)

    this.logger.info({ reportId, actorUserId, status }, 'Platform report reviewed')
    void this.eventBus.publish(new PlatformReportReviewedEvent({
      reportId,
      targetType: report.targetType,
      status,
      nestId: this.resolveNestId(report),
      reviewedById: actorUserId,
    }))
  }

  /**
   * The report's own `nestId` FK is only set for NEST-target reports; THREAD/COMMENT targets
   * carry their nest indirectly, through the reported thread or comment's own nest relation.
   *
   * @param report - The report to resolve a nest id for.
   * @returns The associated nest's id, or `null` for USER/MESSAGE-target reports (no nest at all).
   */
  private resolveNestId(report: PlatformReportSummary): string | null {
    return report.nest?.id ?? report.thread?.nestId ?? report.comment?.thread.nestId ?? null
  }
}
