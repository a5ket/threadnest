import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getPlatformReportListUrl } from '@/generated/api/platform-reports/platform-reports'
import { PlatformReportListStatus } from '@/generated/api/models'
import { PlatformReport } from './platform-report.types'

export async function getPlatformReportsServer(status?: PlatformReportListStatus): Promise<PlatformReport[]> {
  try {
    return await apiClientServer<PlatformReport[]>(getPlatformReportListUrl(status ? { status } : undefined))
  }
  catch (error) {
    if (error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 404)) {
      return []
    }

    throw error
  }
}
