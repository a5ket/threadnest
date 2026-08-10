import { ReportStatus } from 'generated/prisma/enums'
import { ReportPolicySubject } from 'src/report/types/report.policy-subject'

export const createReportPolicySubject = (
  overrides: Partial<ReportPolicySubject> = {},
): ReportPolicySubject => ({
  status: ReportStatus.PENDING,
  ...overrides,
})
