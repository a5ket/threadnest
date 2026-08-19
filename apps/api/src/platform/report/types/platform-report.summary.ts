import type { Prisma } from 'generated/prisma/client'
import { PLATFORM_REPORT_SUMMARY_SELECT } from '../selects/platform-report.summary.select'

export type PlatformReportSummary = Prisma.PlatformReportGetPayload<{
  select: typeof PLATFORM_REPORT_SUMMARY_SELECT
}>
