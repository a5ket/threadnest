import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { PlatformReportSummary } from './types/platform-report.summary'

@Injectable()
export class PlatformReportPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  toSummaryView(report: PlatformReportSummary) {
    return {
      id: report.id,
      targetType: report.targetType,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      reporter: this.userPresenter.toSummaryView(report.reporter),
      resolvedBy: report.resolvedBy ? this.userPresenter.toSummaryView(report.resolvedBy) : null,
      nest: report.nest
        ? { id: report.nest.id, slug: report.nest.slug, name: report.nest.name }
        : null,
      targetUser: report.targetUser ? this.userPresenter.toSummaryView(report.targetUser) : null,
      thread: report.thread
        ? { id: report.thread.id, slug: report.thread.slug, title: report.thread.title }
        : null,
      comment: report.comment
        ? { id: report.comment.id, content: report.comment.content, threadSlug: report.comment.thread.slug, threadTitle: report.comment.thread.title }
        : null,
    }
  }
}
