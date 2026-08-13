import { ReportStatus, ReportTargetType } from 'generated/prisma/enums'

type NestContext = {
  nestSlug: string
  nestName: string
}

type ThreadContext = NestContext & {
  threadSlug: string
  threadTitle: string
}

type CommentContext = ThreadContext & {
  commentId: string
  commentExcerpt: string
}

// Keyed by NotificationType so a value can never be paired with the wrong type — see NotificationRepository.create.
export interface NotificationDataByType {
  THREAD_REPLY: CommentContext
  COMMENT_REPLY: CommentContext
  JOIN_REQUEST_APPROVED: NestContext
  JOIN_REQUEST_REJECTED: NestContext
  NEST_INVITE_RECEIVED: NestContext & { message: string | null }
  BANNED_FROM_NEST: NestContext & { reason: string | null }
  OWNERSHIP_TRANSFERRED: NestContext
  REPORT_RESOLVED: ThreadContext & { status: Exclude<ReportStatus, 'PENDING'>, targetType: ReportTargetType, commentId: string | null }
  CONTENT_REMOVED: ThreadContext & { targetType: ReportTargetType, commentId: string | null, commentExcerpt: string | null }
}
