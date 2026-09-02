import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { ReportSummary } from './types/report.summary'

/** Shapes nest-level content reports into API responses. */
@Injectable()
export class ReportPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  /**
   * Exactly one of `thread`/`comment` is populated, matching the report's `targetType` — the
   * other is `null`.
   *
   * @param report - The report to present.
   * @returns The report's view, including a summary of whichever target it's about.
   */
  toSummaryView(report: ReportSummary) {
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
      thread: report.thread
        ? { id: report.thread.id, slug: report.thread.slug, title: report.thread.title }
        : null,
      comment: report.comment
        ? { id: report.comment.id, content: report.comment.content, threadSlug: report.comment.thread.slug, threadTitle: report.comment.thread.title }
        : null,
    }
  }
}
