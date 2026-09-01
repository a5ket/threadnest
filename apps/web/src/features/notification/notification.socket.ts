'use client'

import { env } from '@/config/env'
import { useIsSignedIn } from '@/features/me/me.hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { notificationQueryKeys } from './notification.hooks'

// The access token is an httpOnly cookie, so it's never read here — withCredentials lets the
// browser attach it to the handshake itself, same as any other same-site request to the API.
export function useNotificationSocket() {
  const isSignedIn = useIsSignedIn()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isSignedIn) return

    const socket = io(env.apiUrl, { withCredentials: true })

    socket.on('notification:created', () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    })

    return () => {
      socket.disconnect()
    }
  }, [isSignedIn, queryClient])
}
