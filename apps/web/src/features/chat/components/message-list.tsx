'use client'

import { InfiniteScrollSentinel } from '@/common/components/infinite-scroll-sentinel'
import { useUser } from '@/features/me/me.hooks'
import { useMessageList } from '../message.hooks'
import type { MessageListPage } from '../chat.server'
import type { Message } from '../chat.types'
import { MessageItem } from './message-item'

interface MessageListProps {
  chatId: string
  initialPage?: MessageListPage
  onReply: (message: Message) => void
}

export function MessageList({ chatId, initialPage, onReply }: MessageListProps) {
  const user = useUser()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessageList(chatId, initialPage)
  const messages = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className='flex min-h-0 flex-1 flex-col-reverse gap-3 overflow-y-auto p-4'>
      {hasNextPage && <InfiniteScrollSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />}

      {isFetchingNextPage && (
        <p className='py-2 text-center text-xs text-muted-foreground'>Loading more...</p>
      )}

      {messages.length === 0 && (
        <p className='py-8 text-center text-sm text-muted-foreground'>No messages yet. Say hi!</p>
      )}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} chatId={chatId} isOwn={message.sender.id === user?.id} onReply={onReply} />
      ))}
    </div>
  )
}
