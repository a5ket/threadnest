import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getChatGetUrl, getChatListUrl, getChatMessageListUrl } from '@/generated/api/chats/chats'
import { ChatList200Data, ChatMessageList200Data } from '@/generated/api/models'
import { ChatDetail, Message } from './chat.types'

export interface ChatListPage {
  items: ChatList200Data['items']
  nextCursor: string | null
}

export async function getChatsServer(archived = false): Promise<ChatListPage> {
  const page = await apiClientServer<ChatList200Data>(getChatListUrl({ limit: 20, archived }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}

export async function getChatServer(chatId: string): Promise<ChatDetail | null> {
  try {
    return await apiClientServer<ChatDetail>(getChatGetUrl(chatId))
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null
    }

    throw error
  }
}

export interface MessageListPage {
  items: Message[]
  nextCursor: string | null
}

export async function getMessagesServer(chatId: string): Promise<MessageListPage> {
  const page = await apiClientServer<ChatMessageList200Data>(getChatMessageListUrl(chatId, { limit: 30 }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}
