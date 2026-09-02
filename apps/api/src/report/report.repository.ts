import { Injectable } from '@nestjs/common'
import { ReportReason, ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { REPORT_SUMMARY_SELECT } from './selects/report.summary.select'
import { ReportNotFoundException } from './exceptions/report-not-found.exception'

/** Persistence for nest-level content reports (threads and comments). */
@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param nestId - The nest the thread belongs to.
   * @param threadId - The thread being reported.
   * @param reporterId - The user filing the report.
   * @param reason - The report reason.
   * @param details - Optional free-text elaboration.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created report.
   */
  async createForThread(nestId: string, threadId: string, reporterId: string, reason: ReportReason, details: string | undefined, db: Database = this.prisma) {
    return db.contentReport.create({
      data: { nestId, threadId, reporterId, targetType: ReportTargetType.THREAD, reason, details },
      select: REPORT_SUMMARY_SELECT
    })
  }

  /**
   * @param nestId - The nest the comment's thread belongs to.
   * @param commentId - The comment being reported.
   * @param reporterId - The user filing the report.
   * @param reason - The report reason.
   * @param details - Optional free-text elaboration.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created report.
   */
  async createForComment(nestId: string, commentId: string, reporterId: string, reason: ReportReason, details: string | undefined, db: Database = this.prisma) {
    return db.contentReport.create({
      data: { nestId, commentId, reporterId, targetType: ReportTargetType.COMMENT, reason, details },
      select: REPORT_SUMMARY_SELECT
    })
  }

  /**
   * @param threadId - The thread to check.
   * @param reporterId - The user who may have already reported it.
   * @returns Whether `reporterId` already has a pending report against this thread.
   */
  async hasPendingReportForThread(threadId: string, reporterId: string) {
    const existing = await this.prisma.contentReport.findFirst({
      where: { threadId, reporterId, status: ReportStatus.PENDING },
      select: { id: true }
    })

    return Boolean(existing)
  }

  /**
   * @param commentId - The comment to check.
   * @param reporterId - The user who may have already reported it.
   * @returns Whether `reporterId` already has a pending report against this comment.
   */
  async hasPendingReportForComment(commentId: string, reporterId: string) {
    const existing = await this.prisma.contentReport.findFirst({
      where: { commentId, reporterId, status: ReportStatus.PENDING },
      select: { id: true }
    })

    return Boolean(existing)
  }

  /**
   * @param nestId - The nest whose reports to list.
   * @param status - Filter to only this status, or omit to list every report regardless of status.
   * @returns Matching reports, newest first.
   */
  async listByNest(nestId: string, status?: ReportStatus) {
    return this.prisma.contentReport.findMany({
      where: { nestId, ...(status ? { status } : {}) },
      select: REPORT_SUMMARY_SELECT,
      orderBy: [{ createdAt: 'desc' }]
    })
  }

  /**
   * @param reportId - The report to fetch.
   * @param nestId - Scopes the lookup so a moderator can't fetch a report belonging to another nest.
   * @returns The report.
   * @throws {ReportNotFoundException} No report with this id in this nest.
   */
  async get(reportId: string, nestId: string) {
    const report = await this.prisma.contentReport.findFirst({
      where: { id: reportId, nestId },
      select: REPORT_SUMMARY_SELECT
    })

    if (!report) {
      throw new ReportNotFoundException()
    }

    return report
  }

  /**
   * @param reportId - The report to resolve.
   * @param status - The terminal status to set (RESOLVED or DISMISSED).
   * @param resolvedById - The moderator reviewing it.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The updated report.
   */
  async updateStatus(reportId: string, status: ReportStatus, resolvedById: string, db: Database = this.prisma) {
    return db.contentReport.update({
      where: { id: reportId },
      data: { status, resolvedAt: new Date(), resolvedById },
      select: REPORT_SUMMARY_SELECT
    })
  }
}
