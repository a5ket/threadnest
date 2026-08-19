'use client'

import { createMutationHook } from '@/common/api-mutation'
import { platformReportDismiss, platformReportResolve } from './platform-report.api'

export const useResolvePlatformReport = createMutationHook(
  (reportId: string) => platformReportResolve(reportId),
  204
)

export const useDismissPlatformReport = createMutationHook(
  (reportId: string) => platformReportDismiss(reportId),
  204
)
