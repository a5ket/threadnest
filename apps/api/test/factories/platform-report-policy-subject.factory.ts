import { PlatformReportStatus } from 'generated/prisma/enums'
import { PlatformReportPolicySubject } from 'src/platform/report/types/platform-report.policy-subject'

export const createPlatformReportPolicySubject = (
  overrides: Partial<PlatformReportPolicySubject> = {},
): PlatformReportPolicySubject => ({
  status: PlatformReportStatus.PENDING,
  ...overrides,
})
