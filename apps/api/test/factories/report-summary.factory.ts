import { ReportReason, ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { ReportSummary } from 'src/report/types/report.summary'

export const createReportSummary = (
  overrides: Partial<ReportSummary> = {},
): ReportSummary => ({
  id: 'report-1',
  targetType: ReportTargetType.THREAD,
  reason: ReportReason.SPAM,
  details: null,
  status: ReportStatus.PENDING,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  resolvedAt: null,
  reporter: { id: 'reporter-1', profile: { username: 'reporter', displayName: null, avatarUrl: null } },
  resolvedBy: null,
  thread: { id: 'thread-1', slug: 'thread-slug', title: 'Thread title' },
  comment: null,
  ...overrides,
})
