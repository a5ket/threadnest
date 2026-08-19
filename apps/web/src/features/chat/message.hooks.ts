'use client'

import { ApiError, ApiErrorResponse } from '@/common/api-error'
import { createMutationHook } from '@/common/api-mutation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { chatMessageDelete, chatMessageList, chatMessageSend } from './chat.api'
import type { MessageListPage } from './chat.server'

export const messageQueryKeys = {
  list: (chatId: string) => ['chats', chatId, 'messages'] as const
}

export function useMessageList(chatId: string, initialPage?: MessageListPage) {
  return useInfiniteQuery({
    queryKey: messageQueryKeys.list(chatId),
    queryFn: async ({ pageParam }): Promise<MessageListPage> => {
      const result = await chatMessageList(chatId, { limit: 30, cursor: pageParam ?? undefined })
      if (result.status !== 200) throw ApiError.fromComposite(result as { status: number, data: ApiErrorResponse })
      return { items: result.data.data.items, nextCursor: result.data.data.meta.nextCursor }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...(initialPage ? { initialData: { pages: [initialPage], pageParams: [null] } } : {})
  })
}

export const useSendMessage = createMutationHook(
  ({ chatId, content, replyToId }: { chatId: string, content: string, replyToId?: string }) =>
    chatMessageSend(chatId, { content, replyToId }),
  201
)

export const useDeleteMessage = createMutationHook(
  ({ chatId, messageId }: { chatId: string, messageId: string }) =>
    chatMessageDelete(chatId, messageId),
  204
)
