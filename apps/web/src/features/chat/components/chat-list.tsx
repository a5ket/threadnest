'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { useState } from 'react'
import { useChatListRoomsSocket, useChatListTyping } from '../chat.socket'
import { useChatList } from '../chat.hooks'
import type { ChatListPage } from '../chat.server'
import { ChatListItem } from './chat-list-item'

interface ChatListProps {
  initialPage?: ChatListPage
  onSelectChat: (chatId: string) => void
}

export function ChatList({ initialPage, onSelectChat }: ChatListProps) {
  const [archived, setArchived] = useState(false)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatList(archived, archived ? undefined : initialPage)
  const chats = data?.pages.flatMap((page) => page.items) ?? []
  const chatIds = chats.map((chat) => chat.id)

  useChatListRoomsSocket(chatIds)
  const typingByChat = useChatListTyping(chatIds)

  return (
    <div className='flex flex-col'>
      <div className='flex items-center gap-2 border-b border-border px-3 py-2'>
        <button
          type='button'
          onClick={() => setArchived(false)}
          className={`rounded-full border px-3 py-1 text-sm font-medium ${!archived ? 'border-foreground text-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >
          Chats
        </button>
        <button
          type='button'
          onClick={() => setArchived(true)}
          className={`rounded-full border px-3 py-1 text-sm font-medium ${archived ? 'border-foreground text-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >
          Archived
        </button>
      </div>

      <ul className='flex flex-col divide-y divide-divider'>
        {chats.map((chat) => (
          <ChatListItem key={chat.id} chat={chat} onSelect={onSelectChat} isTyping={typingByChat.has(chat.id)} />
        ))}

        {chats.length === 0 && (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            {archived ? 'No archived chats.' : 'No chats yet.'}
          </p>
        )}

        {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

        {isFetchingNextPage && (
          <p className='py-4 text-center text-sm text-muted-foreground'>Loading more...</p>
        )}
      </ul>
    </div>
  )
}
