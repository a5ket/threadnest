'use client'

import { Avatar } from '@/common/components/avatar'
import { formatDateTime } from '@/common/format-date'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
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

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleArchive = () => {
    setMenuOpen(false)
    archive.mutate(chat.id)
  }

  const handleUnarchive = () => {
    setMenuOpen(false)
    unarchive.mutate(chat.id)
  }

  const handleDelete = () => {
    setMenuOpen(false)
    clear.mutate(chat.id)
  }

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

      <div ref={menuRef} className='relative shrink-0'>
        <button
          type='button'
          onClick={() => setMenuOpen((open) => !open)}
          aria-label='Chat options'
          className={`rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground ${menuOpen ? '' : 'invisible group-hover:visible'}`}
        >
          <svg viewBox='0 0 20 20' fill='currentColor' className='h-4 w-4'>
            <circle cx='10' cy='4' r='1.5' />
            <circle cx='10' cy='10' r='1.5' />
            <circle cx='10' cy='16' r='1.5' />
          </svg>
        </button>

        {menuOpen && (
          <div className='absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-md border border-border bg-background py-1 text-sm shadow-lg'>
            {chat.archivedAt
              ? (
                  <button
                    type='button'
                    disabled={unarchive.isPending}
                    onClick={handleUnarchive}
                    className='block w-full px-3 py-1.5 text-left hover:bg-muted disabled:opacity-50'
                  >
                    Unarchive
                  </button>
                )
              : (
                  <button
                    type='button'
                    disabled={archive.isPending}
                    onClick={handleArchive}
                    className='block w-full px-3 py-1.5 text-left hover:bg-muted disabled:opacity-50'
                  >
                    Archive
                  </button>
                )}

            <button
              type='button'
              disabled={clear.isPending}
              onClick={handleDelete}
              className='block w-full px-3 py-1.5 text-left text-destructive hover:bg-muted disabled:opacity-50'
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
