import { PlatformReportStatus, PlatformReportTargetType, PlatformRole } from 'generated/prisma/enums'

export interface PlatformActionLogDataByType {
  ROLE_GRANTED: { role: PlatformRole }
  ROLE_CHANGED: { newRole: PlatformRole }
  ROLE_REVOKED: Record<string, never>
  USER_SUSPENDED: { reason: string }
  USER_UNSUSPENDED: Record<string, never>
  THREAD_REMOVED: { threadSlug: string, threadTitle: string, nestSlug: string, nestName: string }
  COMMENT_REMOVED: { commentId: string, commentExcerpt: string, threadSlug: string, threadTitle: string, nestSlug: string, nestName: string }
  CONTENT_BULK_REMOVED: { threadsRemoved: number, commentsRemoved: number }
  REPORT_REVIEWED: { reportId: string, targetType: PlatformReportTargetType, status: Exclude<PlatformReportStatus, 'PENDING'> }
}
