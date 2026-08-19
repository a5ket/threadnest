'use client'

import { createMutationHook } from '@/common/api-mutation'
import { PlatformReportCreateDto } from '@/generated/api/models'
import { platformReportCreate, platformReportDismiss, platformReportResolve } from './platform-report.api'

export const useCreatePlatformReport = createMutationHook(
  (dto: PlatformReportCreateDto) => platformReportCreate(dto),
  201
)

export const useResolvePlatformReport = createMutationHook(
  (reportId: string) => platformReportResolve(reportId),
  204
)

export const useDismissPlatformReport = createMutationHook(
  (reportId: string) => platformReportDismiss(reportId),
  204
)
