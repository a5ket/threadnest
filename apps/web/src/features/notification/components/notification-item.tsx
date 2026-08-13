'use client'

import { formatDateTime } from '@/common/format-date'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { getNotificationContent } from '../notification-content'
import { notificationQueryKeys, useMarkNotificationRead } from '../notification.hooks'
import type { Notification } from '../notification.types'

interface NotificationItemProps {
  notification: Notification
  onNavigate?: () => void
}

export function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const isUnread = notification.readAt === null
  const queryClient = useQueryClient()

  const markRead = useMarkNotificationRead({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
  })

  const { text, href } = getNotificationContent(notification)

  const handleClick = () => {
    if (isUnread) markRead.mutate(notification.id)
    onNavigate?.()
  }

  return (
    <li>
      <Link
        href={href}
        onClick={handleClick}
        className={`flex items-start gap-2 px-3 py-2 text-sm hover:bg-muted ${isUnread ? 'bg-primary/5' : ''}`}
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? 'bg-primary' : 'bg-transparent'}`} aria-hidden='true' />

        <span className='flex flex-col gap-0.5'>
          <span className={isUnread ? 'font-medium text-foreground' : 'text-foreground'}>{text}</span>
          <span className='text-xs text-muted-foreground'>{formatDateTime(notification.createdAt)}</span>
        </span>
      </Link>
    </li>
  )
}
