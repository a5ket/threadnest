'use client'

import { useSocket } from '@/common/realtime/socket-provider'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { joinChatRoom, leaveChatRoom } from './chat-room-membership'
import { chatQueryKeys } from './chat.hooks'
import { messageQueryKeys } from './message.hooks'

const TYPING_STOP_DELAY_MS = 3000
const TYPING_EXPIRY_MS = 6000 // fallback for a stop event that never arrives (tab closed).

export function useChatRoomSocket(chatId: string) {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    joinChatRoom(socket, chatId)

    const handleCreated = () => {
      void queryClient.invalidateQueries({ queryKey: messageQueryKeys.list(chatId) })
      void queryClient.invalidateQueries({ queryKey: ['chats', 'list'] })
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount })
    }

    socket.on('message:created', handleCreated)

    return () => {
      socket.off('message:created', handleCreated)
      leaveChatRoom(socket, chatId)
    }
  }, [socket, chatId, queryClient])
}

interface TypingPayload {
  chatId: string
  userId: string
}

const EMPTY_TYPING_SET: ReadonlySet<string> = new Set()

// Tracks who's typing per chat, scoped to whichever chat rooms the caller has joined - the
// gateway only delivers events for rooms this socket is actually a member of.
function useTypingTracker(chatIds: string[]): Map<string, Set<string>> {
  const socket = useSocket()
  const [typingByChat, setTypingByChat] = useState<Map<string, Set<string>>>(new Map())
  const expiryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const key = chatIds.join(',')

  useEffect(() => {
    if (!socket) return

    const relevant = new Set(key ? key.split(',') : [])
    const timers = expiryTimers.current
    const timerKey = (chatId: string, userId: string) => `${chatId}:${userId}`

    const setTyping = (chatId: string, userId: string, typing: boolean) => {
      setTypingByChat((prev) => {
        const users = new Set(prev.get(chatId) ?? [])
        if (typing) {
          users.add(userId)
        }
        else {
          users.delete(userId)
        }

        const next = new Map(prev)
        if (users.size > 0) {
          next.set(chatId, users)
        }
        else {
          next.delete(chatId)
        }
        return next
      })
    }

    const clearExpiry = (chatId: string, userId: string) => {
      const k = timerKey(chatId, userId)
      const timer = timers.get(k)
      if (timer) {
        clearTimeout(timer)
        timers.delete(k)
      }
    }

    const handleStart = (payload: TypingPayload) => {
      if (!relevant.has(payload.chatId)) return

      setTyping(payload.chatId, payload.userId, true)
      clearExpiry(payload.chatId, payload.userId)
      timers.set(timerKey(payload.chatId, payload.userId), setTimeout(() => {
        setTyping(payload.chatId, payload.userId, false)
        timers.delete(timerKey(payload.chatId, payload.userId))
      }, TYPING_EXPIRY_MS))
    }

    const handleStop = (payload: TypingPayload) => {
      if (!relevant.has(payload.chatId)) return

      clearExpiry(payload.chatId, payload.userId)
      setTyping(payload.chatId, payload.userId, false)
    }

    socket.on('chat:typing:start', handleStart)
    socket.on('chat:typing:stop', handleStop)

    return () => {
      socket.off('chat:typing:start', handleStart)
      socket.off('chat:typing:stop', handleStop)
      timers.forEach(clearTimeout)
      timers.clear()
      setTypingByChat(new Map())
    }
  }, [socket, key])

  return typingByChat
}

// Security relies on the gateway's room-membership check, not on anything in this hook.
export function useChatTyping(chatId: string) {
  const socket = useSocket()
  const typingByChat = useTypingTracker([chatId])
  const typingUserIds = typingByChat.get(chatId) ?? EMPTY_TYPING_SET
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTyping = useRef(false)

  // Bypasses the debounce so the indicator clears immediately on send/unmount.
  const stopTyping = useCallback(() => {
    if (stopTimer.current) {
      clearTimeout(stopTimer.current)
      stopTimer.current = null
    }

    if (isTyping.current && socket) {
      isTyping.current = false
      socket.emit('chat:typing:stop', { chatId })
    }
  }, [socket, chatId])

  useEffect(() => stopTyping, [stopTyping])

  const notifyTyping = useCallback(() => {
    if (!socket) return

    if (!isTyping.current) {
      isTyping.current = true
      socket.emit('chat:typing:start', { chatId })
    }

    if (stopTimer.current) clearTimeout(stopTimer.current)
    stopTimer.current = setTimeout(stopTyping, TYPING_STOP_DELAY_MS)
  }, [socket, chatId, stopTyping])

  return { typingUserIds, notifyTyping, stopTyping }
}

// Joins every listed chat's room and keeps the chat list (preview, order, unread badge) in sync
// with messages arriving in chats that aren't the one currently open.
export function useChatListRoomsSocket(chatIds: string[]) {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const key = chatIds.join(',')

  useEffect(() => {
    if (!socket) return

    const ids = key ? key.split(',') : []
    ids.forEach((id) => joinChatRoom(socket, id))

    const handleCreated = () => {
      void queryClient.invalidateQueries({ queryKey: ['chats', 'list'] })
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount })
    }

    socket.on('message:created', handleCreated)

    return () => {
      socket.off('message:created', handleCreated)
      ids.forEach((id) => leaveChatRoom(socket, id))
    }
  }, [socket, key, queryClient])
}

// Typing state only - room membership for the list is owned by useChatListRoomsSocket.
export function useChatListTyping(chatIds: string[]) {
  return useTypingTracker(chatIds)
}

interface ChatReadPayload {
  chatId: string
  userId: string
  at: string
}

// Keyed by chatId (like the typing tracker) rather than reset-on-change, so switching chats never
// needs a setState-in-effect just to clear stale state - each chat simply reads its own key.
// restReadAt is the initial value from the chat detail response; live events only ever move it
// forward from there, so the two are combined by taking whichever is more recent.
export function useOtherParticipantReadAt(chatId: string, otherParticipantId: string | undefined, restReadAt: string | null): string | null {
  const socket = useSocket()
  const [liveReadAtByChat, setLiveReadAtByChat] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (!socket || !otherParticipantId) return

    const handleRead = (payload: ChatReadPayload) => {
      if (payload.chatId !== chatId || payload.userId !== otherParticipantId) return

      setLiveReadAtByChat((prev) => {
        const current = prev.get(chatId)
        if (current && current >= payload.at) return prev

        const next = new Map(prev)
        next.set(chatId, payload.at)
        return next
      })
    }

    socket.on('chat:read', handleRead)

    return () => {
      socket.off('chat:read', handleRead)
    }
  }, [socket, chatId, otherParticipantId])

  const liveReadAt = liveReadAtByChat.get(chatId) ?? null

  if (liveReadAt && (!restReadAt || liveReadAt > restReadAt)) return liveReadAt
  return restReadAt
}
