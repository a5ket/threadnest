import { Injectable } from '@nestjs/common'
import { PlatformReportStatus, PlatformReportTargetType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { PlatformReportCreateDto } from './dto/platform-report-create.dto'
import { PlatformReportNotFoundException } from './exceptions/platform-report-not-found.exception'
import { PLATFORM_REPORT_SUMMARY_SELECT } from './selects/platform-report.summary.select'

@Injectable()
export class PlatformReportRepository {
  constructor(private readonly prisma: PrismaService) { }

  async targetExists(targetType: PlatformReportTargetType, targetId: string) {
    const existing = await (() => {
      switch (targetType) {
        case PlatformReportTargetType.NEST: return this.prisma.nest.findUnique({ where: { id: targetId }, select: { id: true } })
        case PlatformReportTargetType.USER: return this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
        case PlatformReportTargetType.THREAD: return this.prisma.thread.findUnique({ where: { id: targetId }, select: { id: true } })
        case PlatformReportTargetType.COMMENT: return this.prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } })
      }
    })()

    return Boolean(existing)
  }

  async create(reporterId: string, dto: PlatformReportCreateDto, db: Database = this.prisma) {
    return db.platformReport.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        reason: dto.reason,
        details: dto.details,
        ...this.targetForeignKey(dto.targetType, dto.targetId)
      },
      select: PLATFORM_REPORT_SUMMARY_SELECT
    })
  }

  async hasPendingReport(targetType: PlatformReportTargetType, targetId: string, reporterId: string) {
    const existing = await this.prisma.platformReport.findFirst({
      where: { ...this.targetForeignKey(targetType, targetId), reporterId, status: PlatformReportStatus.PENDING },
      select: { id: true }
    })

    return Boolean(existing)
  }

  async list(status?: PlatformReportStatus) {
    return this.prisma.platformReport.findMany({
      where: status ? { status } : {},
      select: PLATFORM_REPORT_SUMMARY_SELECT,
      orderBy: [{ createdAt: 'desc' }]
    })
  }

  async get(reportId: string) {
    const report = await this.prisma.platformReport.findUnique({
      where: { id: reportId },
      select: PLATFORM_REPORT_SUMMARY_SELECT
    })

    if (!report) {
      throw new PlatformReportNotFoundException()
    }

    return report
  }

  async updateStatus(reportId: string, status: PlatformReportStatus, resolvedById: string, db: Database = this.prisma) {
    return db.platformReport.update({
      where: { id: reportId },
      data: { status, resolvedAt: new Date(), resolvedById },
      select: PLATFORM_REPORT_SUMMARY_SELECT
    })
  }

  private targetForeignKey(targetType: PlatformReportTargetType, targetId: string) {
    switch (targetType) {
      case PlatformReportTargetType.NEST: return { nestId: targetId }
      case PlatformReportTargetType.USER: return { targetUserId: targetId }
      case PlatformReportTargetType.THREAD: return { threadId: targetId }
      case PlatformReportTargetType.COMMENT: return { commentId: targetId }
    }
  }

}
