'use client'

import { Avatar } from '@/common/components/avatar'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { chatQueryKeys, useChat } from '../chat.hooks'
import { useChatRoomSocket, useChatTyping } from '../chat.socket'
import { messageQueryKeys } from '../message.hooks'
import type { MessageListPage } from '../chat.server'
import type { Message } from '../chat.types'
import { MessageComposer } from './message-composer'
import { MessageList } from './message-list'

interface ChatPanelProps {
  chatId: string
  initialMessages?: MessageListPage
  onBack?: () => void
}

export function ChatPanel({ chatId, initialMessages, onBack }: ChatPanelProps) {
  const { data: chat, isLoading } = useChat(chatId)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const queryClient = useQueryClient()

  useChatRoomSocket(chatId)
  const { typingUserIds, notifyTyping, stopTyping } = useChatTyping(chatId)

  const handleSent = () => {
    stopTyping()
    queryClient.invalidateQueries({ queryKey: messageQueryKeys.list(chatId) })
    queryClient.invalidateQueries({ queryKey: ['chats', 'list'] })
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount })
  }

  const name = chat?.otherParticipant?.profile?.displayName ?? chat?.otherParticipant?.profile?.username ?? 'Unknown user'

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='flex shrink-0 items-center gap-3 border-b border-border p-3'>
        {onBack && (
          <button type='button' onClick={onBack} aria-label='Back' className='rounded-md p-1 hover:bg-muted'>
            <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' className='h-4 w-4'>
              <path d='M12 15l-5-5 5-5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        )}

        {chat && (
          <>
            <Avatar avatarUrl={chat.otherParticipant?.profile?.avatarUrl ?? null} label={name} size={32} />
            <div className='flex min-w-0 flex-col'>
              <span className='truncate text-sm font-semibold'>{name}</span>
              <span className={`text-xs font-medium text-primary ${typingUserIds.size > 0 ? '' : 'invisible'}`}>
                typing...
              </span>
            </div>
          </>
        )}
      </div>

      {isLoading && <p className='flex-1 p-4 text-sm text-muted-foreground'>Loading...</p>}

      {chat && (
        <>
          <MessageList chatId={chatId} initialPage={initialMessages} onReply={setReplyingTo} />
          <MessageComposer chat={chat} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} onSent={handleSent} onTyping={notifyTyping} />
        </>
      )}
    </div>
  )
}
