import { Injectable } from '@nestjs/common'
import { ReportReason, ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { REPORT_SUMMARY_SELECT } from './selects/report.summary.select'
import { ReportNotFoundException } from './exceptions/report-not-found.exception'

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createForThread(nestId: string, threadId: string, reporterId: string, reason: ReportReason, details: string | undefined, db: Database = this.prisma) {
    return db.contentReport.create({
      data: { nestId, threadId, reporterId, targetType: ReportTargetType.THREAD, reason, details },
      select: REPORT_SUMMARY_SELECT
    })
  }

  async createForComment(nestId: string, commentId: string, reporterId: string, reason: ReportReason, details: string | undefined, db: Database = this.prisma) {
    return db.contentReport.create({
      data: { nestId, commentId, reporterId, targetType: ReportTargetType.COMMENT, reason, details },
      select: REPORT_SUMMARY_SELECT
    })
  }

  async hasPendingReportForThread(threadId: string, reporterId: string) {
    const existing = await this.prisma.contentReport.findFirst({
      where: { threadId, reporterId, status: ReportStatus.PENDING },
      select: { id: true }
    })

    return Boolean(existing)
  }

  async hasPendingReportForComment(commentId: string, reporterId: string) {
    const existing = await this.prisma.contentReport.findFirst({
      where: { commentId, reporterId, status: ReportStatus.PENDING },
      select: { id: true }
    })

    return Boolean(existing)
  }

  async listByNest(nestId: string, status?: ReportStatus) {
    return this.prisma.contentReport.findMany({
      where: { nestId, ...(status ? { status } : {}) },
      select: REPORT_SUMMARY_SELECT,
      orderBy: [{ createdAt: 'desc' }]
    })
  }

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

  async updateStatus(reportId: string, status: ReportStatus, resolvedById: string, db: Database = this.prisma) {
    return db.contentReport.update({
      where: { id: reportId },
      data: { status, resolvedAt: new Date(), resolvedById },
      select: REPORT_SUMMARY_SELECT
    })
  }
}
