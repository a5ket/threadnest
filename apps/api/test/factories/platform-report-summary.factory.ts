import { PlatformReportReason, PlatformReportStatus, PlatformReportTargetType } from 'generated/prisma/enums'
import { PlatformReportSummary } from 'src/platform/report/types/platform-report.summary'

export const createPlatformReportSummary = (
  overrides: Partial<PlatformReportSummary> = {},
): PlatformReportSummary => ({
  id: 'platform-report-1',
  targetType: PlatformReportTargetType.THREAD,
  reason: PlatformReportReason.SPAM_NETWORK,
  details: null,
  status: PlatformReportStatus.PENDING,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  resolvedAt: null,
  reporter: { id: 'reporter-1', profile: { username: 'reporter', displayName: null, avatarKey: null } },
  resolvedBy: null,
  nest: null,
  targetUser: null,
  thread: { id: 'thread-1', slug: 'thread-slug', title: 'Thread title', nestId: 'nest-1' },
  comment: null,
  message: null,
  ...overrides,
})
