import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { PlatformReportSummary } from './types/platform-report.summary'

/** Shapes platform reports into API responses. */
@Injectable()
export class PlatformReportPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  /**
   * Exactly one of `nest`/`targetUser`/`thread`/`comment`/`message` is populated, matching the
   * report's `targetType` — the rest are `null`.
   *
   * @param report - The report to present.
   * @returns The report's view, including a summary of whichever target it's about.
   */
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
      message: report.message
        ? { id: report.message.id, content: report.message.content, chatId: report.message.chatId, senderId: report.message.senderId, createdAt: report.message.createdAt }
        : null,
    }
  }
}
