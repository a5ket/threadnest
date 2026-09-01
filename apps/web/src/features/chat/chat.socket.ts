'use client'

import { useSocket } from '@/common/realtime/socket-provider'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { chatQueryKeys } from './chat.hooks'
import { messageQueryKeys } from './message.hooks'

// Joins the chat's room for the lifetime of the component (e.g. an open ChatPanel) so this
// client receives message:created pushes for it — the gateway authorizes the join server-side.
export function useChatRoomSocket(chatId: string) {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    socket.emit('chat:join', { chatId })

    const handleCreated = () => {
      void queryClient.invalidateQueries({ queryKey: messageQueryKeys.list(chatId) })
      void queryClient.invalidateQueries({ queryKey: ['chats', 'list'] })
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount })
    }

    socket.on('message:created', handleCreated)

    return () => {
      socket.off('message:created', handleCreated)
      socket.emit('chat:leave', { chatId })
    }
  }, [socket, chatId, queryClient])
}
