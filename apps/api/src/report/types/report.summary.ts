import type { Prisma } from 'generated/prisma/client'
import { REPORT_SUMMARY_SELECT } from '../selects/report.summary.select'

export type ReportSummary = Prisma.ContentReportGetPayload<{
  select: typeof REPORT_SUMMARY_SELECT
}>
