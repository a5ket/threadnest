import { SortTabLink } from '@/common/components/sort-tab-link'
import { NotificationList } from '@/features/notification/components/notification-list'
import { NotificationMarkAllReadButton } from '@/features/notification/components/notification-mark-all-read-button'
import { getNotificationsServer } from '@/features/notification/notification.server'

export default async function NotificationsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const unreadOnly = filter === 'unread'

  const page = await getNotificationsServer(unreadOnly)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-lg font-semibold'>Notifications</h1>
        <NotificationMarkAllReadButton />
      </div>

      <div className='flex items-center gap-2'>
        <SortTabLink href='/me/notifications' active={!unreadOnly}>All</SortTabLink>
        <SortTabLink href='/me/notifications?filter=unread' active={unreadOnly}>Unread</SortTabLink>
      </div>

      <NotificationList unreadOnly={unreadOnly} initialPage={page} />
    </div>
  )
}
