'use client'

import { Avatar } from '@/common/components/avatar'
import { formatDateTime } from '@/common/format-date'
import { useQueryClient } from '@tanstack/react-query'
import { useArchiveChat, useClearChat, useUnarchiveChat } from '../chat.hooks'
import type { ChatSummary } from '../chat.types'

interface ChatListItemProps {
  chat: ChatSummary
  onSelect: (chatId: string) => void
  isTyping: boolean
}

export function ChatListItem({ chat, onSelect, isTyping }: ChatListItemProps) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chats', 'list'] })

  const archive = useArchiveChat({ onSuccess: invalidate })
  const unarchive = useUnarchiveChat({ onSuccess: invalidate })
  const clear = useClearChat({ onSuccess: invalidate })

  const name = chat.otherParticipant?.profile?.displayName ?? chat.otherParticipant?.profile?.username ?? 'Unknown user'
  const preview = chat.lastMessage
    ? (chat.lastMessage.content ?? 'This message was deleted')
    : 'No messages yet'

  return (
    <li className='group flex items-center gap-3 px-3 py-2 hover:bg-muted'>
      <button type='button' onClick={() => onSelect(chat.id)} className='flex min-w-0 flex-1 items-center gap-3 text-left'>
        <Avatar avatarUrl={chat.otherParticipant?.profile?.avatarUrl ?? null} label={name} size={40} />

        <div className='min-w-0 flex-1'>
          <div className='flex items-center justify-between gap-2'>
            <span className={`truncate text-sm ${chat.hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
              {name}
            </span>
            {chat.lastMessage && (
              <span className='shrink-0 text-xs text-muted-foreground'>{formatDateTime(chat.lastMessage.createdAt)}</span>
            )}
          </div>

          <p className={isTyping ? 'truncate text-sm font-medium text-primary' : `truncate text-sm ${chat.hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {isTyping ? 'typing...' : preview}
          </p>
        </div>

        {chat.hasUnread && <span className='h-2 w-2 shrink-0 rounded-full bg-primary' aria-label='Unread' />}
      </button>

      <div className='hidden shrink-0 items-center gap-2 text-xs text-muted-foreground group-hover:flex'>
        {chat.archivedAt
          ? (
              <button type='button' disabled={unarchive.isPending} onClick={() => unarchive.mutate(chat.id)} className='hover:underline disabled:opacity-50'>
                Unarchive
              </button>
            )
          : (
              <button type='button' disabled={archive.isPending} onClick={() => archive.mutate(chat.id)} className='hover:underline disabled:opacity-50'>
                Archive
              </button>
            )}

        <button type='button' disabled={clear.isPending} onClick={() => clear.mutate(chat.id)} className='hover:text-destructive hover:underline disabled:opacity-50'>
          Delete
        </button>
      </div>
    </li>
  )
}
