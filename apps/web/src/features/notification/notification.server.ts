import { apiClientServer } from '@/common/server-api-client'
import { getMeNotificationListUrl } from '@/generated/api/notifications/notifications'
import { MeNotificationList200Data } from '@/generated/api/models'

export interface NotificationListPage {
  items: MeNotificationList200Data['items']
  nextCursor: string | null
}

export async function getNotificationsServer(unreadOnly: boolean): Promise<NotificationListPage> {
  const page = await apiClientServer<MeNotificationList200Data>(getMeNotificationListUrl({ limit: 20, unreadOnly }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}
