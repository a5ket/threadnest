import { apiClientServer } from '@/common/server-api-client'
import { getUserActivityListUrl } from '@/generated/api/users/users'
import { UserActivityList200Data } from '@/generated/api/models'
import type { UserActivityItem } from './user-activity.types'

export interface UserActivityPage {
  items: UserActivityItem[]
  nextCursor: string | null
}

export async function getUserActivityServer(username: string): Promise<UserActivityPage> {
  const page = await apiClientServer<UserActivityList200Data>(getUserActivityListUrl(username, { limit: 20 }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}
