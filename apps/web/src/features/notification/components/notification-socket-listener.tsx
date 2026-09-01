'use client'

import { useNotificationSocket } from '../notification.socket'

export function NotificationSocketListener() {
  useNotificationSocket()
  return null
}
