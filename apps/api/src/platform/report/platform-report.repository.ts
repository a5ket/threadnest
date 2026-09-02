import { Injectable } from '@nestjs/common'
import { PlatformReportStatus, PlatformReportTargetType } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { PlatformReportCreateDto } from './dto/platform-report-create.dto'
import { PlatformReportNotFoundException } from './exceptions/platform-report-not-found.exception'
import { PLATFORM_REPORT_SUMMARY_SELECT } from './selects/platform-report.summary.select'

/** Persistence for user-filed reports of platform content (nests, users, threads, comments, messages). */
@Injectable()
export class PlatformReportRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param targetType - The kind of entity being reported.
   * @param targetId - The entity's id.
   * @returns Whether the target still exists — a report can outlive its target if the target is
   * later deleted, so this is only meaningful at report-creation time.
   */
  async targetExists(targetType: PlatformReportTargetType, targetId: string) {
    const existing = await (() => {
      switch (targetType) {
        case PlatformReportTargetType.NEST: return this.prisma.nest.findUnique({ where: { id: targetId }, select: { id: true } })
        case PlatformReportTargetType.USER: return this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
        case PlatformReportTargetType.THREAD: return this.prisma.thread.findUnique({ where: { id: targetId }, select: { id: true } })
        case PlatformReportTargetType.COMMENT: return this.prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } })
        case PlatformReportTargetType.MESSAGE: return this.prisma.message.findUnique({ where: { id: targetId }, select: { id: true } })
      }
    })()

    return Boolean(existing)
  }

  /**
   * @param reporterId - The user filing the report.
   * @param dto - The target, reason, and optional details.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The created report.
   */
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

  /**
   * @param targetType - The kind of entity.
   * @param targetId - The entity's id.
   * @param reporterId - The user who may have already reported it.
   * @returns Whether `reporterId` already has a pending (unreviewed) report against this target —
   * used to prevent duplicate reports from the same user piling up in the queue.
   */
  async hasPendingReport(targetType: PlatformReportTargetType, targetId: string, reporterId: string) {
    const existing = await this.prisma.platformReport.findFirst({
      where: { ...this.targetForeignKey(targetType, targetId), reporterId, status: PlatformReportStatus.PENDING },
      select: { id: true }
    })

    return Boolean(existing)
  }

  /**
   * @param status - Filter to only this status, or omit to list every report regardless of status.
   * @returns Matching reports, newest first.
   */
  async list(status?: PlatformReportStatus) {
    return this.prisma.platformReport.findMany({
      where: status ? { status } : {},
      select: PLATFORM_REPORT_SUMMARY_SELECT,
      orderBy: [{ createdAt: 'desc' }]
    })
  }

  /**
   * @param reportId - The report to fetch.
   * @returns The report.
   * @throws {PlatformReportNotFoundException} No report with this id.
   */
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

  /**
   * @param reportId - The report to resolve.
   * @param status - The terminal status to set (RESOLVED or DISMISSED).
   * @param resolvedById - The moderator reviewing it.
   * @param db - Optional transaction client; defaults to the standalone prisma client.
   * @returns The updated report.
   */
  async updateStatus(reportId: string, status: PlatformReportStatus, resolvedById: string, db: Database = this.prisma) {
    return db.platformReport.update({
      where: { id: reportId },
      data: { status, resolvedAt: new Date(), resolvedById },
      select: PLATFORM_REPORT_SUMMARY_SELECT
    })
  }

  /**
   * Maps a report's polymorphic target to the specific foreign-key column it's stored under —
   * each target type has its own nullable FK column on the report row.
   *
   * @param targetType - The kind of entity.
   * @param targetId - The entity's id.
   * @returns A single-key object for the matching FK column.
   */
  private targetForeignKey(targetType: PlatformReportTargetType, targetId: string) {
    switch (targetType) {
      case PlatformReportTargetType.NEST: return { nestId: targetId }
      case PlatformReportTargetType.USER: return { targetUserId: targetId }
      case PlatformReportTargetType.THREAD: return { threadId: targetId }
      case PlatformReportTargetType.COMMENT: return { commentId: targetId }
      case PlatformReportTargetType.MESSAGE: return { messageId: targetId }
    }
  }

}
