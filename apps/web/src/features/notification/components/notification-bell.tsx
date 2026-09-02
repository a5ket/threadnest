'use client'

import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { notificationQueryKeys, useMarkAllNotificationsRead, useMarkNotificationsSeen, useRecentNotifications, useUnseenNotificationCount } from '../notification.hooks'
import { NotificationItem } from './notification-item'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: unseenCount } = useUnseenNotificationCount()
  const { data: notifications, isLoading } = useRecentNotifications(open)

  const markSeen = useMarkNotificationsSeen({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unseenCount })
  })

  const markAllRead = useMarkAllNotificationsRead({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
  })

  // Opening the panel clears the unseen badge immediately, independent of whether items get read.
  useEffect(() => {
    if (open) markSeen.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const count = unseenCount ?? 0
  const hasUnseen = count > 0
  const hasUnread = notifications?.some((notification) => notification.readAt === null) ?? false

  return (
    <div ref={containerRef} className='relative'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-label='Notifications'
        className='relative rounded-md p-2 hover:bg-muted'
      >
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-5 w-5'>
          <path d='M4 8a6 6 0 0 1 12 0c0 4 1.5 5 1.5 5h-15S4 12 4 8Z' strokeLinejoin='round' />
          <path d='M8 16a2 2 0 0 0 4 0' strokeLinecap='round' />
        </svg>

        {hasUnseen && (
          <span className='absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground'>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-md border border-border bg-background shadow-lg'>
          <div className='flex items-center justify-between border-b border-border px-3 py-2'>
            <span className='text-sm font-semibold'>Notifications</span>

            {hasUnread && (
              <button
                type='button'
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className='text-xs font-medium text-primary hover:underline disabled:opacity-50'
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className='max-h-96 overflow-y-auto'>
            {isLoading && <p className='px-3 py-3 text-sm text-muted-foreground'>Loading...</p>}

            {!isLoading && notifications?.length === 0 && (
              <p className='px-3 py-3 text-sm text-muted-foreground'>No notifications yet.</p>
            )}

            {!isLoading && notifications && notifications.length > 0 && (
              <ul className='flex flex-col divide-y divide-divider'>
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} onNavigate={() => setOpen(false)} />
                ))}
              </ul>
            )}
          </div>

          <Link
            href='/me/notifications'
            onClick={() => setOpen(false)}
            className='block border-t border-border px-3 py-2 text-center text-sm font-medium text-primary hover:underline'
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
