import { Injectable } from '@nestjs/common'
import { ReportStatus } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from 'src/nest/nest.access'
import { ThreadNotFoundException } from 'src/thread/exceptions/thread-not-found.exception'
import { ThreadAccessContext } from 'src/thread/types/thread.access-context'
import { ReportAlreadyResolvedException } from './exceptions/report-already-resolved.exception'
import type { ReportPolicySubject } from './types/report.policy-subject'

/** Authorization for nest-level content reports (threads and comments), reviewed by nest moderators. */
@Injectable()
export class ReportPolicy {
  constructor(private readonly nestAccess: NestAccess) { }

  /**
   * Reused for reporting a comment too, via the comment's parent thread's context — anyone who
   * can view the thread can report either it or a comment on it.
   *
   * @param threadCtx - The reporter's access context for the thread.
   * @throws {ThreadNotFoundException} The thread isn't visible to the reporter.
   */
  assertCanReportThread(threadCtx: ThreadAccessContext) {
    if (!threadCtx.canViewThread) {
      throw new ThreadNotFoundException()
    }
  }

  /**
   * @param nestId - The nest whose report queue is being viewed.
   * @param actorUserId - The user attempting to view it.
   * @throws {InsufficientPermissionsException} Not a moderator in this nest.
   */
  async assertCanListQueue(nestId: string, actorUserId: string) {
    await this.assertCanModerateContent(nestId, actorUserId)
  }

  /**
   * @param report - The report to review.
   * @param nestId - The nest the report belongs to.
   * @param actorUserId - The user attempting to review it.
   * @throws {InsufficientPermissionsException} Not a moderator in this nest.
   * @throws {ReportAlreadyResolvedException} Already resolved or dismissed.
   */
  async assertCanReview(report: ReportPolicySubject, nestId: string, actorUserId: string) {
    await this.assertCanModerateContent(nestId, actorUserId)

    if (report.status !== ReportStatus.PENDING) {
      throw new ReportAlreadyResolvedException()
    }
  }

  /**
   * @param nestId - The nest to check moderation authority in.
   * @param actorUserId - The user to check.
   * @throws {InsufficientPermissionsException} Not a moderator in this nest.
   */
  private async assertCanModerateContent(nestId: string, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nestId, actorUserId)

    if (!ctx.canModerateContent) {
      throw new InsufficientPermissionsException()
    }
  }
}
