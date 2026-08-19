import { Injectable } from '@nestjs/common'
import { PlatformReportStatus } from 'generated/prisma/enums'
import { PlatformReportCreateDto } from './dto/platform-report-create.dto'
import { AlreadyReportedToPlatformException } from './exceptions/already-reported-to-platform.exception'
import { PlatformReportTargetNotFoundException } from './exceptions/platform-report-target-not-found.exception'
import { PlatformReportPolicy } from './platform-report.policy'
import { PlatformReportPresenter } from './platform-report.presenter'
import { PlatformReportRepository } from './platform-report.repository'

@Injectable()
export class PlatformReportService {
  constructor(
    private readonly reportsRepo: PlatformReportRepository,
    private readonly policy: PlatformReportPolicy,
    private readonly presenter: PlatformReportPresenter,
  ) { }

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

  async listQueue(actorUserId: string, status?: PlatformReportStatus) {
    await this.policy.assertIsModerator(actorUserId)

    const reports = await this.reportsRepo.list(status)

    return reports.map((report) => this.presenter.toSummaryView(report))
  }

  async resolve(reportId: string, actorUserId: string) {
    await this.setStatus(reportId, actorUserId, PlatformReportStatus.RESOLVED)
  }

  async dismiss(reportId: string, actorUserId: string) {
    await this.setStatus(reportId, actorUserId, PlatformReportStatus.DISMISSED)
  }

  private async setStatus(reportId: string, actorUserId: string, status: Exclude<PlatformReportStatus, 'PENDING'>) {
    await this.policy.assertIsModerator(actorUserId)

    const report = await this.reportsRepo.get(reportId)

    this.policy.assertCanReview(report)

    await this.reportsRepo.updateStatus(reportId, status, actorUserId)
  }
}
