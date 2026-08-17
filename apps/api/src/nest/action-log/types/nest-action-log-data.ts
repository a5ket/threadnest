import { NestMemberRole, ReportStatus, ReportTargetType } from 'generated/prisma/enums'

export interface NestActionLogDataByType {
  MEMBER_ROLE_CHANGED: { newRole: NestMemberRole }
  MEMBER_BANNED: { reason: string | null }
  MEMBER_UNBANNED: Record<string, never>
  MEMBER_REMOVED: Record<string, never>
  JOIN_REQUEST_APPROVED: Record<string, never>
  JOIN_REQUEST_REJECTED: Record<string, never>
  THREAD_REMOVED: { threadSlug: string, threadTitle: string }
  COMMENT_REMOVED: { threadSlug: string, threadTitle: string, commentId: string, commentExcerpt: string }
  REPORT_RESOLVED: { reportId: string, status: Exclude<ReportStatus, 'PENDING'>, targetType: ReportTargetType, threadSlug: string, threadTitle: string, commentId: string | null }
  SETTINGS_UPDATED: Record<string, never>
  OWNERSHIP_TRANSFERRED: Record<string, never>
}
