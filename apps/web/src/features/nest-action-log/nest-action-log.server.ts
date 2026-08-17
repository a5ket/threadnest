import { apiClientServer } from '@/common/server-api-client'
import { getNestActionLogListUrl } from '@/generated/api/nest-action-log/nest-action-log'
import { NestActionLogList200Data } from '@/generated/api/models'

export interface NestActionLogListPage {
  items: NestActionLogList200Data['items']
  nextCursor: string | null
}

export async function getNestActionLogsServer(nestSlug: string): Promise<NestActionLogListPage> {
  const page = await apiClientServer<NestActionLogList200Data>(getNestActionLogListUrl(nestSlug, { limit: 20 }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}
