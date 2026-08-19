'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { useIsSignedIn } from '@/features/me/me.hooks'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { chatArchive, chatClear, chatGet, chatList, chatStart, chatUnarchive, chatUnreadCount } from './chat.api'
import type { ChatListPage } from './chat.server'

export const chatQueryKeys = {
  list: (archived: boolean) => ['chats', 'list', archived] as const,
  detail: (chatId: string) => ['chats', 'detail', chatId] as const,
  unreadCount: ['chats', 'unread-count'] as const
}

const UNREAD_COUNT_POLL_MS = 30_000

export function useChatList(archived: boolean, initialPage?: ChatListPage) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.list(archived),
    queryFn: async ({ pageParam }): Promise<ChatListPage> => {
      const result = await chatList({ limit: 20, archived, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...(initialPage ? { initialData: { pages: [initialPage], pageParams: [null] } } : {})
  })
}

export function useChat(chatId: string) {
  return useQuery({
    queryKey: chatQueryKeys.detail(chatId),
    queryFn: async () => {
      const result = await chatGet(chatId)
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data
    }
  })
}

export function useChatUnreadCount() {
  const isSignedIn = useIsSignedIn()

  return useQuery({
    queryKey: chatQueryKeys.unreadCount,
    queryFn: async () => {
      const result = await chatUnreadCount()
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return result.data.data.count
    },
    enabled: isSignedIn,
    refetchInterval: UNREAD_COUNT_POLL_MS
  })
}

export const useStartChat = createMutationHook(
  (userId: string) => chatStart({ userId }),
  201
)

export const useArchiveChat = createMutationHook(
  (chatId: string) => chatArchive(chatId),
  204
)

export const useUnarchiveChat = createMutationHook(
  (chatId: string) => chatUnarchive(chatId),
  204
)

export const useClearChat = createMutationHook(
  (chatId: string) => chatClear(chatId),
  204
)
