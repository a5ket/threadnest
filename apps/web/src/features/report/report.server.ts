import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getNestReportListUrl } from '@/generated/api/reports/reports'
import { NestReportListStatus } from '@/generated/api/models'
import { Report } from './report.types'

export async function getNestReportsServer(nestSlug: string, status?: NestReportListStatus): Promise<Report[]> {
  try {
    return await apiClientServer<Report[]>(getNestReportListUrl(nestSlug, status ? { status } : undefined))
  }
  catch (error) {
    if (error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 404)) {
      return []
    }

    throw error
  }
}
