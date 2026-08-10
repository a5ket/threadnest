'use client'

import { createMutationHook } from '@/common/api-mutation'
import { ReportCreateDto } from '@/generated/api/models'
import { commentReportCreate, nestReportDismiss, nestReportResolve, nestThreadReportCreate } from './report.api'

export const useReportThread = createMutationHook(
  ({ nestSlug, threadSlug, ...dto }: { nestSlug: string, threadSlug: string } & ReportCreateDto) =>
    nestThreadReportCreate(nestSlug, threadSlug, dto),
  201
)

export const useReportComment = createMutationHook(
  ({ commentId, ...dto }: { commentId: string } & ReportCreateDto) =>
    commentReportCreate(commentId, dto),
  201
)

export const useResolveReport = createMutationHook(
  ({ nestSlug, reportId }: { nestSlug: string, reportId: string }) => nestReportResolve(nestSlug, reportId),
  204
)

export const useDismissReport = createMutationHook(
  ({ nestSlug, reportId }: { nestSlug: string, reportId: string }) => nestReportDismiss(nestSlug, reportId),
  204
)
