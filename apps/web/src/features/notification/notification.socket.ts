'use client'

import { useSocket } from '@/common/realtime/socket-provider'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { notificationQueryKeys } from './notification.hooks'

export function useNotificationSocket() {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    const handleCreated = () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    }

    socket.on('notification:created', handleCreated)

    return () => {
      socket.off('notification:created', handleCreated)
    }
  }, [socket, queryClient])
}
