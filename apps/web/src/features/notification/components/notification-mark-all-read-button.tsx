'use client'

import { useQueryClient } from '@tanstack/react-query'
import { notificationQueryKeys, useMarkAllNotificationsRead } from '../notification.hooks'

export function NotificationMarkAllReadButton() {
  const queryClient = useQueryClient()

  const markAllRead = useMarkAllNotificationsRead({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
  })

  return (
    <button
      type='button'
      onClick={() => markAllRead.mutate()}
      disabled={markAllRead.isPending}
      className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
    >
      Mark all as read
    </button>
  )
}
