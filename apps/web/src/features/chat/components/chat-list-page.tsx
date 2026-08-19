'use client'

import { useRouter } from 'next/navigation'
import type { ChatListPage } from '../chat.server'
import { ChatList } from './chat-list'

interface ChatListPageProps {
  initialPage: ChatListPage
}

export function ChatListPageComponent({ initialPage }: ChatListPageProps) {
  const router = useRouter()

  return <ChatList initialPage={initialPage} onSelectChat={(chatId) => router.push(`/chats/${chatId}`)} />
}
