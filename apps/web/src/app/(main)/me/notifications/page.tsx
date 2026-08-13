import { NotificationList } from '@/features/notification/components/notification-list'
import { NotificationMarkAllReadButton } from '@/features/notification/components/notification-mark-all-read-button'
import { getNotificationsServer } from '@/features/notification/notification.server'
import Link from 'next/link'

export default async function NotificationsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const unreadOnly = filter === 'unread'

  const page = await getNotificationsServer(unreadOnly)

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-lg font-semibold'>Notifications</h1>
        <NotificationMarkAllReadButton />
      </div>

      <div className='flex items-center gap-3 text-sm'>
        <Link
          href='/me/notifications'
          className={!unreadOnly ? 'font-medium text-foreground' : 'text-muted-foreground hover:underline'}
        >
          All
        </Link>
        <Link
          href='/me/notifications?filter=unread'
          className={unreadOnly ? 'font-medium text-foreground' : 'text-muted-foreground hover:underline'}
        >
          Unread
        </Link>
      </div>

      <NotificationList unreadOnly={unreadOnly} initialPage={page} />
    </div>
  )
}
