import { apiClientServer } from '@/common/server-api-client'
import { getPlatformActionLogListUrl } from '@/generated/api/platform-action-log/platform-action-log'
import { PlatformActionLogList200Data } from '@/generated/api/models'
import type { PlatformActionLogFilters } from './platform-action-log.types'

export interface PlatformActionLogListPage {
  items: PlatformActionLogList200Data['items']
  nextCursor: string | null
}

export async function getPlatformActionLogsServer(filters: PlatformActionLogFilters = {}): Promise<PlatformActionLogListPage> {
  const page = await apiClientServer<PlatformActionLogList200Data>(getPlatformActionLogListUrl({ limit: 20, ...filters }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}
